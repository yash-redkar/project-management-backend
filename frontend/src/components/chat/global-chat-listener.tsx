"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/context/auth-context";
import { getSocket } from "@/lib/socket";
import {
  incrementChatUnread,
  upsertChatConversationMeta,
} from "@/lib/chat-unread";
import { chatService } from "@/services/chat.service";
import { projectService } from "@/services/project.service";

function normalizeMaybeObjectId(value: any): string {
  if (!value) return "";

  if (typeof value === "string") return value;

  if (typeof value === "object" && typeof value._id === "string") {
    return value._id;
  }

  if (typeof value === "object" && typeof value.$oid === "string") {
    return value.$oid;
  }

  if (typeof value?.toString === "function") {
    const str = value.toString();
    if (str && str !== "[object Object]") return str;
  }

  return "";
}

export function GlobalChatListener() {
  const { user } = useAuth();

  const joinedConversationIdsRef = useRef<Set<string>>(new Set());
  const knownConversationIdsRef = useRef<Set<string>>(new Set());
  const activeConversationIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user?._id) return;

    const socket = getSocket();
    if (!socket) return;

    const joinConversationRoom = (conversationId: string) => {
      if (!conversationId) return;
      if (joinedConversationIdsRef.current.has(conversationId)) return;

      socket.emit("join_conversation", { conversationId });
      joinedConversationIdsRef.current.add(conversationId);
      knownConversationIdsRef.current.add(conversationId);
    };

    const bootstrapKnownConversations = async () => {
      try {
        const rawWorkspaceId =
          typeof window !== "undefined"
            ? localStorage.getItem("teamforge_active_workspace_id") || ""
            : "";

        if (!rawWorkspaceId) return;

        const workspaceConversationRes =
          await chatService.getWorkspaceConversation(rawWorkspaceId);

        const workspaceConversationId = workspaceConversationRes?.data?._id;

        if (workspaceConversationId) {
          upsertChatConversationMeta(String(workspaceConversationId), {
            conversationType: "workspace",
            workspaceId: rawWorkspaceId,
          });
          joinConversationRoom(workspaceConversationId);
        }

        const projectsRes =
          await projectService.getProjectsByWorkspace(rawWorkspaceId);

        const projectItems = Array.isArray(projectsRes?.data)
          ? projectsRes.data
          : [];

        for (const item of projectItems) {
          const project = item?.project || item;
          const projectId = project?._id;

          if (!projectId) continue;

          try {
            const conversationRes = await chatService.getProjectConversation(
              rawWorkspaceId,
              projectId,
            );

            const conversationId = conversationRes?.data?._id;

            if (conversationId) {
              upsertChatConversationMeta(String(conversationId), {
                conversationType: "project",
                workspaceId: rawWorkspaceId,
                projectId: String(projectId),
              });
              joinConversationRoom(conversationId);
            }
          } catch (error) {
            console.error(
              "Failed to preload project conversation:",
              projectId,
              error,
            );
          }
        }
      } catch (error) {
        const status = (error as any)?.response?.status;

        if (status === 403) {
          localStorage.removeItem("teamforge_active_workspace_id");
          return;
        }

        console.error("Failed to bootstrap chat listener:", error);
      }
    };

    const handleConnect = () => {
      joinedConversationIdsRef.current.clear();

      if (knownConversationIdsRef.current.size > 0) {
        knownConversationIdsRef.current.forEach((conversationId) => {
          socket.emit("join_conversation", { conversationId });
          joinedConversationIdsRef.current.add(conversationId);
        });
        return;
      }

      void bootstrapKnownConversations();
    };

    const handleMessageCreated = (message: any) => {
      const conversationId =
        normalizeMaybeObjectId(message?.conversationId) ||
        normalizeMaybeObjectId(message?.conversation);

      const conversationType = String(
        message?.conversationType || "",
      ).toLowerCase();
      const workspaceId = normalizeMaybeObjectId(message?.workspaceId);
      const projectId = normalizeMaybeObjectId(message?.projectId);

      const senderId = normalizeMaybeObjectId(message?.sender?._id);

      if (!conversationId) return;
      if (String(senderId) === String(user._id)) return;

      upsertChatConversationMeta(String(conversationId), {
        conversationType,
        workspaceId,
        projectId,
      });

      const isCurrentlyOpenConversation =
        String(activeConversationIdRef.current) === String(conversationId);

      if (!isCurrentlyOpenConversation) {
        incrementChatUnread(String(conversationId), {
          conversationType,
          workspaceId,
          projectId,
        });
      }
    };

    const handleActiveConversationChanged = (event: Event) => {
      const customEvent = event as CustomEvent<{
        conversationId?: string | null;
      }>;
      activeConversationIdRef.current =
        customEvent.detail?.conversationId || null;
    };

    if (socket.connected) {
      handleConnect();
    }

    socket.on("connect", handleConnect);
    socket.on("message_created", handleMessageCreated);

    window.addEventListener(
      "teamforge-active-conversation-changed",
      handleActiveConversationChanged,
    );

    return () => {
      socket.off("connect", handleConnect);
      socket.off("message_created", handleMessageCreated);
      window.removeEventListener(
        "teamforge-active-conversation-changed",
        handleActiveConversationChanged,
      );
    };
  }, [user?._id]);

  return null;
}
