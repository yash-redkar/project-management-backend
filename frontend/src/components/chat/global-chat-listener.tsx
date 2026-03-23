"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { getSocket } from "@/lib/socket";
import { incrementChatUnread } from "@/lib/chat-unread";
import { chatService } from "@/services/chat.service";
import { projectService } from "@/services/project.service";

function getRouteInfo(pathname: string) {
  const workspaceChatMatch = pathname.match(/^\/workspaces\/([^/]+)\/chat$/);
  const projectChatMatch = pathname.match(
    /^\/workspaces\/([^/]+)\/projects\/([^/]+)\/chat$/,
  );

  if (projectChatMatch) {
    return {
      type: "project" as const,
      workspaceId: projectChatMatch[1],
      projectId: projectChatMatch[2],
    };
  }

  if (workspaceChatMatch) {
    return {
      type: "workspace" as const,
      workspaceId: workspaceChatMatch[1],
      projectId: null,
    };
  }

  return {
    type: null,
    workspaceId: null,
    projectId: null,
  };
}

export function GlobalChatListener() {
  const pathname = usePathname();
  const { user } = useAuth();

  const joinedConversationIdsRef = useRef<Set<string>>(new Set());
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
        console.error("Failed to bootstrap chat listener:", error);
      }
    };

    const syncActiveConversation = async () => {
      try {
        const routeInfo = getRouteInfo(pathname);

        if (!routeInfo.type || !routeInfo.workspaceId) {
          activeConversationIdRef.current = null;
          return;
        }

        if (routeInfo.type === "workspace") {
          const workspaceConversationRes =
            await chatService.getWorkspaceConversation(routeInfo.workspaceId);

          const conversationId = workspaceConversationRes?.data?._id || null;

          activeConversationIdRef.current = conversationId;

          if (conversationId) {
            joinConversationRoom(conversationId);
          }

          return;
        }

        if (routeInfo.type === "project" && routeInfo.projectId) {
          const projectConversationRes =
            await chatService.getProjectConversation(
              routeInfo.workspaceId,
              routeInfo.projectId,
            );

          const conversationId = projectConversationRes?.data?._id || null;

          activeConversationIdRef.current = conversationId;

          if (conversationId) {
            joinConversationRoom(conversationId);
          }

          return;
        }

        activeConversationIdRef.current = null;
      } catch (error) {
        console.error("Failed to sync active conversation:", error);
        activeConversationIdRef.current = null;
      }
    };

    const handleConnect = () => {
      joinedConversationIdsRef.current.clear();
      void bootstrapKnownConversations();
      void syncActiveConversation();
    };

    const handleMessageCreated = (message: any) => {
      const conversationId =
        typeof message?.conversation === "string"
          ? message.conversation
          : message?.conversation?._id;

      const senderId = message?.sender?._id;

      if (!conversationId) return;
      if (String(senderId) === String(user._id)) return;

      const isCurrentlyOpenConversation =
        String(activeConversationIdRef.current) === String(conversationId);

      if (!isCurrentlyOpenConversation) {
        incrementChatUnread(String(conversationId));
      }
    };

    if (socket.connected) {
      handleConnect();
    }

    socket.on("connect", handleConnect);
    socket.on("message_created", handleMessageCreated);

    void syncActiveConversation();

    return () => {
      socket.off("connect", handleConnect);
      socket.off("message_created", handleMessageCreated);
    };
  }, [pathname, user?._id]);

  return null;
}
