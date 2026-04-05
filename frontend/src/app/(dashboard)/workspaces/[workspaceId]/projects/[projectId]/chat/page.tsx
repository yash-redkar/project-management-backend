"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { MessageSquare, Users } from "lucide-react";
import { workspaceService } from "@/services/workspace.service";
import { projectService } from "@/services/project.service";
import { chatService } from "@/services/chat.service";
import { useAuth } from "@/context/auth-context";
import { getSocket } from "@/lib/socket";
import { clearChatUnread } from "@/lib/chat-unread";

export default function ProjectChatPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { user: currentUser } = useAuth();

  const workspaceId =
    typeof params.workspaceId === "string"
      ? params.workspaceId
      : Array.isArray(params.workspaceId)
        ? params.workspaceId[0]
        : "";

  const projectId =
    typeof params.projectId === "string"
      ? params.projectId
      : Array.isArray(params.projectId)
        ? params.projectId[0]
        : "";

  const [workspaceName, setWorkspaceName] = useState("");
  const [projectItem, setProjectItem] = useState<any>(null);
  const [projectConversation, setProjectConversation] = useState<any>(null);
  const [activeConversation, setActiveConversation] = useState<any>(null);
  const [chatMode, setChatMode] = useState<"project" | "personal">("project");
  const [projectMembers, setProjectMembers] = useState<any[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [typingUsers, setTypingUsers] = useState<any[]>([]);

  const queryMode = searchParams.get("mode") || "";
  const queryConversationId = searchParams.get("conversationId") || "";

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const formatMessageTime = (value: string) => {
    if (!value) return "";
    return new Date(value).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatMessageDate = (value: string) => {
    if (!value) return "";
    return new Date(value).toLocaleDateString([], {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getSenderName = (sender: any) => {
    return (
      sender?.fullname ||
      sender?.name ||
      sender?.username ||
      sender?.email ||
      "Unknown User"
    );
  };

  const getTypingText = () => {
    const names = typingUsers
      .map(
        (user) =>
          user?.fullname ||
          user?.name ||
          user?.username ||
          user?.email ||
          "Someone",
      )
      .filter(Boolean);

    if (names.length === 0) return "";
    if (names.length === 1) return `${names[0]} is typing...`;
    if (names.length === 2) return `${names[0]} and ${names[1]} are typing...`;
    return `${names.length} people are typing...`;
  };

  const normalizeMember = (item: any) => {
    const user = item?.user || item?.member || item;

    return {
      _id: String(user?._id || ""),
      fullname:
        user?.fullname ||
        user?.fullName ||
        user?.name ||
        user?.username ||
        user?.email ||
        "Unknown User",
      username: user?.username || "",
      email: user?.email || "No email",
      avatar: user?.avatar || "",
      role: item?.role || "member",
    };
  };

  const loadConversationMessages = async (conversationId: string) => {
    const messagesRes = await chatService.getConversationMessages(
      conversationId,
      {
        limit: 50,
      },
    );

    const items = Array.isArray(messagesRes?.data?.items)
      ? messagesRes.data.items
      : [];

    setMessages(items);
  };

  const openPersonalChat = async (memberId: string) => {
    try {
      const conversationRes =
        await chatService.getOrCreateProjectDirectConversation(
          workspaceId,
          projectId,
          memberId,
        );

      const directConversation = conversationRes?.data;

      setChatMode("personal");
      setSelectedMemberId(memberId);
      setTypingUsers([]);
      setMessageText("");
      setActiveConversation(directConversation);

      if (directConversation?._id) {
        await loadConversationMessages(directConversation._id);
      } else {
        setMessages([]);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(
        err?.response?.data?.message ||
          "Failed to open personal chat with this member",
      );
    }
  };

  const loadProjectChat = async () => {
    try {
      setIsLoading(true);
      setError("");

      const [projectRes, workspaceRes, conversationRes, membersRes] =
        await Promise.all([
          projectService.getProjectById(workspaceId, projectId),
          workspaceService.getWorkspaces(),
          chatService.getProjectConversation(workspaceId, projectId),
          projectService.getProjectMembers(workspaceId, projectId),
        ]);

      const allWorkspaces = Array.isArray(workspaceRes.data)
        ? workspaceRes.data
        : [];

      const foundWorkspace = allWorkspaces.find((item: any) => {
        const workspace = item.workspace || item;
        return workspace._id === workspaceId;
      });

      const projectData = projectRes.data;
      setProjectItem(projectData);
      setWorkspaceName(
        foundWorkspace?.workspace?.name || foundWorkspace?.name || "",
      );

      const normalizedMembers = Array.isArray(membersRes?.data)
        ? membersRes.data.map(normalizeMember)
        : [];
      setProjectMembers(normalizedMembers);

      const conversationData = conversationRes?.data;
      setProjectConversation(conversationData);

      if (queryMode === "personal" && queryConversationId) {
        const directConversationsRes =
          await chatService.getProjectDirectConversations(
            workspaceId,
            projectId,
          );

        const directItems = Array.isArray(directConversationsRes?.data)
          ? directConversationsRes.data
          : [];

        const matchedDirect = directItems.find(
          (item: any) => String(item?._id) === String(queryConversationId),
        );

        if (matchedDirect?._id) {
          setChatMode("personal");
          setActiveConversation(matchedDirect);

          const participants = Array.isArray(matchedDirect?.participants)
            ? matchedDirect.participants
            : [];

          const otherParticipant = participants.find(
            (item: any) =>
              String(item?._id || item) !== String(currentUser?._id || ""),
          );

          const otherParticipantId = String(
            otherParticipant?._id || otherParticipant || "",
          );

          setSelectedMemberId(otherParticipantId);

          await loadConversationMessages(String(matchedDirect._id));
        } else if (conversationData?._id) {
          setChatMode("project");
          setSelectedMemberId("");
          setActiveConversation(conversationData);
          await loadConversationMessages(conversationData._id);
        } else {
          setChatMode("project");
          setSelectedMemberId("");
          setActiveConversation(null);
          setMessages([]);
        }
      } else if (conversationData?._id) {
        setChatMode("project");
        setSelectedMemberId("");
        setActiveConversation(conversationData);
        await loadConversationMessages(conversationData._id);
      } else {
        setChatMode("project");
        setSelectedMemberId("");
        setActiveConversation(null);
        setMessages([]);
      }
    } catch (err: any) {
      console.error(err);
      const message =
        err?.response?.data?.message || "Failed to load project chat";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (workspaceId && projectId) {
      loadProjectChat();
    }
  }, [workspaceId, projectId, queryMode, queryConversationId]);

  useEffect(() => {
    if (activeConversation?._id) {
      clearChatUnread(activeConversation._id);
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("teamforge-active-conversation-changed", {
          detail: { conversationId: activeConversation?._id || null },
        }),
      );
    }

    return () => {
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("teamforge-active-conversation-changed", {
            detail: { conversationId: null },
          }),
        );
      }
    };
  }, [activeConversation?._id]);

  useEffect(() => {
    if (!activeConversation?._id) return;

    const socket = getSocket();
    if (!socket) return;

    const handleConnect = () => {
      socket.emit("join_conversation", {
        conversationId: activeConversation._id,
      });
    };

    const handleJoined = () => {
      console.log("Joined conversation:", activeConversation._id);
    };

    const handleMessageCreated = (message: any) => {
      setMessages((prev) => {
        const exists = prev.some((item) => item._id === message?._id);
        if (exists) return prev;
        return [...prev, message];
      });

      setTypingUsers((prev) =>
        prev.filter(
          (item) => String(item?._id) !== String(message?.sender?._id),
        ),
      );

      if (activeConversation?._id) {
        clearChatUnread(activeConversation._id);
      }
    };

    const handleTypingStarted = (payload: any) => {
      const typingUser = payload?.user;

      if (
        typingUser?._id &&
        currentUser?._id &&
        String(typingUser._id) === String(currentUser._id)
      ) {
        return;
      }

      setTypingUsers((prev) => {
        const exists = prev.some(
          (item) => String(item?._id) === String(typingUser?._id),
        );
        if (exists) return prev;
        return [...prev, typingUser];
      });
    };

    const handleTypingStopped = (payload: any) => {
      const typingUserId = payload?.userId;

      setTypingUsers((prev) =>
        prev.filter((item) => String(item?._id) !== String(typingUserId)),
      );
    };

    const handleError = (payload: any) => {
      const message =
        typeof payload === "string"
          ? payload
          : typeof payload?.message === "string"
            ? payload.message
            : "";

      if (!message.trim()) {
        return;
      }

      console.error("Socket error:", message);
    };

    if (socket.connected) {
      handleConnect();
    }

    socket.on("connect", handleConnect);
    socket.on("joined_conversation", handleJoined);
    socket.on("message_created", handleMessageCreated);
    socket.on("typing_started", handleTypingStarted);
    socket.on("typing_stopped", handleTypingStopped);
    socket.on("error_event", handleError);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("joined_conversation", handleJoined);
      socket.off("message_created", handleMessageCreated);
      socket.off("typing_started", handleTypingStarted);
      socket.off("typing_stopped", handleTypingStopped);
      socket.off("error_event", handleError);
    };
  }, [activeConversation?._id, currentUser?._id]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const groupedMessages = useMemo(() => {
    const groups: { date: string; items: any[] }[] = [];

    messages.forEach((message) => {
      const dateLabel = formatMessageDate(message.createdAt);
      const lastGroup = groups[groups.length - 1];

      if (lastGroup && lastGroup.date === dateLabel) {
        lastGroup.items.push(message);
      } else {
        groups.push({
          date: dateLabel,
          items: [message],
        });
      }
    });

    return groups;
  }, [messages]);

  const personalChatMembers = useMemo(() => {
    return projectMembers.filter(
      (member) => String(member._id) !== String(currentUser?._id || ""),
    );
  }, [projectMembers, currentUser?._id]);

  const selectedMember = useMemo(() => {
    return personalChatMembers.find(
      (member) => String(member._id) === String(selectedMemberId),
    );
  }, [personalChatMembers, selectedMemberId]);

  const handleSendMessage = async () => {
    const cleanText = messageText.trim();

    if (!cleanText) return;

    if (!activeConversation?._id) {
      toast.error("Conversation not ready");
      return;
    }

    try {
      setIsSending(true);

      const socket = getSocket();
      if (!socket) {
        toast.error("Socket not connected");
        return;
      }

      socket.emit("typing_stop", {
        conversationId: activeConversation._id,
      });

      socket.emit("send_message", {
        conversationId: activeConversation._id,
        text: cleanText,
      });

      setMessageText("");

      setTypingUsers((prev) =>
        prev.filter((item) => String(item?._id) !== String(currentUser?._id)),
      );
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 text-white">
        <h1 className="text-3xl font-semibold">Project Chat</h1>
        <p className="text-slate-400">Loading project chat...</p>
      </div>
    );
  }

  if (error || !projectItem) {
    return (
      <div className="space-y-4 text-white">
        <h1 className="text-3xl font-semibold">Project Chat</h1>
        <p className="text-red-400">{error || "Project not found"}</p>
        <Link
          href={
            workspaceId ? `/workspaces/${workspaceId}/projects` : "/workspaces"
          }
          className="inline-flex rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-800"
        >
          Back to Projects
        </Link>
      </div>
    );
  }

  const project = projectItem.project || projectItem;
  const role = projectItem.role || "member";

  const conversationHeading =
    chatMode === "project"
      ? `${project.name || "Project"} Chat`
      : selectedMember
        ? `Chat with ${selectedMember.fullname}`
        : "Select a member";

  const conversationSubheading =
    chatMode === "project"
      ? "Collaborate with project members in one focused conversation."
      : selectedMember
        ? "Private conversation visible only to you and this member."
        : "Choose a member from the list to start a personal chat.";

  return (
    <div className="space-y-6 text-white">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Project Chat</h1>
          <p className="mt-2 text-slate-400">
            Discussion for <span className="text-white">{project.name}</span>.
          </p>
        </div>

        <Link
          href={`/workspaces/${workspaceId}/projects/${projectId}`}
          className="inline-flex rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-800"
        >
          Back
        </Link>
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <p className="text-sm text-slate-400">Project</p>
          <p className="mt-3 text-xl font-semibold">
            {project.name || "Untitled Project"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <p className="text-sm text-slate-400">Workspace</p>
          <p className="mt-3 text-xl font-semibold">
            {workspaceName || "Unknown"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <p className="text-sm text-slate-400">Your Role</p>
          <p className="mt-3 text-xl font-semibold capitalize">{role}</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <p className="text-sm text-slate-400">Channel</p>
          <p className="mt-3 text-xl font-semibold capitalize">
            {chatMode === "project" ? "Project Chat" : "Personal Chat"}
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
        <div className="mb-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={async () => {
              setChatMode("project");
              setSelectedMemberId("");
              setTypingUsers([]);
              setMessageText("");
              setActiveConversation(projectConversation);

              if (projectConversation?._id) {
                await loadConversationMessages(projectConversation._id);
              } else {
                setMessages([]);
              }
            }}
            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
              chatMode === "project"
                ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
                : "border-slate-700 text-slate-300 hover:bg-slate-800"
            }`}
          >
            <Users className="size-4" />
            Project Chat
          </button>

          <button
            type="button"
            onClick={() => {
              setChatMode("personal");
              setTypingUsers([]);
              setMessageText("");
              setActiveConversation(null);
              setMessages([]);
            }}
            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
              chatMode === "personal"
                ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
                : "border-slate-700 text-slate-300 hover:bg-slate-800"
            }`}
          >
            <MessageSquare className="size-4" />
            Personal Chat
          </button>
        </div>

        <div className="mb-6 flex flex-col gap-4 border-b border-slate-800 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">
              {conversationHeading}
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              {conversationSubheading}
            </p>
          </div>

          <div className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300">
            Live conversation
          </div>
        </div>

        <div className="flex h-[65vh] overflow-hidden rounded-2xl border border-slate-800 bg-zinc-950/60">
          {chatMode === "personal" ? (
            <aside className="hidden w-72 shrink-0 border-r border-slate-800 bg-slate-950/40 p-3 lg:block">
              <p className="mb-3 px-2 text-xs uppercase tracking-[0.12em] text-slate-500">
                Project Members
              </p>

              <div className="space-y-2 overflow-y-auto">
                {personalChatMembers.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-700 px-3 py-3 text-xs text-slate-500">
                    No other members in this project yet.
                  </p>
                ) : (
                  personalChatMembers.map((member) => (
                    <button
                      key={member._id}
                      type="button"
                      onClick={() => openPersonalChat(member._id)}
                      className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                        selectedMemberId === member._id
                          ? "border-cyan-500/40 bg-cyan-500/10"
                          : "border-slate-800 bg-slate-900/50 hover:bg-slate-900"
                      }`}
                    >
                      <p className="truncate text-sm font-medium text-white">
                        {member.fullname}
                      </p>
                      <p className="truncate text-xs text-slate-400">
                        {member.email}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </aside>
          ) : null}

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              {chatMode === "personal" && !activeConversation ? (
                <div className="flex h-full items-center justify-center">
                  <div className="max-w-md text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300">
                      <MessageSquare className="size-6" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-white">
                      Start a personal conversation
                    </h3>
                    <p className="mt-2 text-sm text-slate-400">
                      Pick a project member to open a private chat.
                    </p>
                  </div>
                </div>
              ) : groupedMessages.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <div className="max-w-md text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300">
                      💬
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-white">
                      No project messages yet
                    </h3>
                    <p className="mt-2 text-sm text-slate-400">
                      Start the project discussion with your first message.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {groupedMessages.map((group, groupIndex) => (
                    <div key={`${group.date}-${groupIndex}`}>
                      <div className="mb-4 flex items-center gap-3">
                        <div className="h-px flex-1 bg-slate-800" />
                        <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-[11px] text-slate-400">
                          {group.date}
                        </span>
                        <div className="h-px flex-1 bg-slate-800" />
                      </div>

                      <div className="space-y-3">
                        {group.items.map((message: any, index: number) => {
                          const sender = message.sender;
                          const isOwnMessage =
                            currentUser?._id && sender?._id
                              ? String(currentUser._id) === String(sender._id)
                              : false;

                          return (
                            <div
                              key={message._id || index}
                              className={`flex ${
                                isOwnMessage ? "justify-end" : "justify-start"
                              }`}
                            >
                              <div
                                className={`max-w-[80%] rounded-2xl border px-4 py-3 sm:max-w-[70%] ${
                                  isOwnMessage
                                    ? "border-cyan-500/30 bg-cyan-500/10"
                                    : "border-slate-800 bg-slate-900/80"
                                }`}
                              >
                                <div className="mb-1 flex items-center gap-2">
                                  <span
                                    className={`text-xs font-semibold ${
                                      isOwnMessage
                                        ? "text-cyan-300"
                                        : "text-white"
                                    }`}
                                  >
                                    {isOwnMessage
                                      ? "You"
                                      : getSenderName(sender)}
                                  </span>

                                  <span className="text-[11px] text-slate-500">
                                    {formatMessageTime(message.createdAt)}
                                  </span>
                                </div>

                                <p className="text-sm leading-6 text-slate-200">
                                  {message.text}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            <div className="border-t border-slate-800 bg-slate-950/80 p-4">
              {typingUsers.length > 0 ? (
                <p className="mb-2 text-xs text-cyan-300">{getTypingText()}</p>
              ) : null}

              <div className="flex items-end gap-3">
                <textarea
                  value={messageText}
                  onChange={(e) => {
                    const value = e.target.value;
                    setMessageText(value);

                    const socket = getSocket();
                    if (!socket || !activeConversation?._id) return;

                    socket.emit("typing_start", {
                      conversationId: activeConversation._id,
                    });

                    if (typingTimeoutRef.current) {
                      clearTimeout(typingTimeoutRef.current);
                    }

                    typingTimeoutRef.current = setTimeout(() => {
                      socket.emit("typing_stop", {
                        conversationId: activeConversation._id,
                      });
                    }, 1200);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (!isSending) {
                        handleSendMessage();
                      }
                    }
                  }}
                  rows={2}
                  placeholder={
                    chatMode === "project"
                      ? "Write a message to the project..."
                      : activeConversation
                        ? "Write a personal message..."
                        : "Select a member to start personal chat..."
                  }
                  className="min-h-[56px] flex-1 resize-none rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-500"
                />

                <button
                  onClick={handleSendMessage}
                  disabled={
                    isSending || !messageText.trim() || !activeConversation
                  }
                  className="rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSending ? "Sending..." : "Send"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
