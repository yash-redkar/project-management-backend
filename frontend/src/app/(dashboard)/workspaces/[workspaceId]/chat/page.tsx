"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { workspaceService } from "@/services/workspace.service";
import { chatService } from "@/services/chat.service";
import { useAuth } from "@/context/auth-context";
import { getSocket } from "@/lib/socket";
import { clearChatUnread } from "@/lib/chat-unread";

export default function WorkspaceChatPage() {
  const params = useParams();
  const { user: currentUser } = useAuth();

  const workspaceId =
    typeof params.workspaceId === "string"
      ? params.workspaceId
      : Array.isArray(params.workspaceId)
        ? params.workspaceId[0]
        : "";

  const [workspaceItem, setWorkspaceItem] = useState<any>(null);
  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [typingUsers, setTypingUsers] = useState<any[]>([]);

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

  const loadWorkspaceChat = async () => {
    try {
      setIsLoading(true);
      setError("");

      const [workspaceRes, conversationRes] = await Promise.all([
        workspaceService.getWorkspaces(),
        chatService.getWorkspaceConversation(workspaceId),
      ]);

      const allWorkspaces = Array.isArray(workspaceRes.data)
        ? workspaceRes.data
        : [];

      const foundWorkspace = allWorkspaces.find((item: any) => {
        const workspace = item.workspace || item;
        return workspace._id === workspaceId;
      });

      if (!foundWorkspace) {
        setError("Workspace not found");
        return;
      }

      setWorkspaceItem(foundWorkspace);

      const conversationData = conversationRes?.data;
      setConversation(conversationData);

      if (conversationData?._id) {
        const messagesRes = await chatService.getConversationMessages(
          conversationData._id,
          { limit: 50 },
        );

        const items = Array.isArray(messagesRes?.data?.items)
          ? messagesRes.data.items
          : [];

        setMessages(items);
      }
    } catch (err: any) {
      console.error(err);
      const message =
        err?.response?.data?.message || "Failed to load workspace chat";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (workspaceId) {
      loadWorkspaceChat();
    }
  }, [workspaceId]);

  useEffect(() => {
    if (conversation?._id) {
      clearChatUnread(conversation._id);
    }
  }, [conversation?._id]);

  useEffect(() => {
    if (!conversation?._id) return;

    const socket = getSocket();
    if (!socket) return;

    const handleConnect = () => {
      socket.emit("join_conversation", {
        conversationId: conversation._id,
      });
    };

    const handleJoined = () => {
      console.log("Joined workspace conversation:", conversation._id);
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

      if (conversation?._id) {
        clearChatUnread(conversation._id);
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
      console.error("Socket error:", payload);
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
  }, [conversation?._id, currentUser?._id]);

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

  const handleSendMessage = async () => {
    const cleanText = messageText.trim();

    if (!cleanText) return;

    if (!conversation?._id) {
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
        conversationId: conversation._id,
      });

      socket.emit("send_message", {
        conversationId: conversation._id,
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
        <h1 className="text-3xl font-semibold">Workspace Chat</h1>
        <p className="text-slate-400">Loading workspace chat...</p>
      </div>
    );
  }

  if (error || !workspaceItem) {
    return (
      <div className="space-y-4 text-white">
        <h1 className="text-3xl font-semibold">Workspace Chat</h1>
        <p className="text-red-400">{error || "Workspace not found"}</p>
        <Link
          href="/workspaces"
          className="inline-flex rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-800"
        >
          Back to Workspaces
        </Link>
      </div>
    );
  }

  const workspace = workspaceItem.workspace || workspaceItem;
  const role = workspaceItem.role || "member";

  return (
    <div className="space-y-6 text-white">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Workspace Chat</h1>
          <p className="mt-2 text-slate-400">
            General discussion for{" "}
            <span className="text-white">{workspace.name}</span>.
          </p>
        </div>

        <Link
          href={`/workspaces/${workspaceId}`}
          className="inline-flex rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-800"
        >
          Back
        </Link>
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <p className="text-sm text-slate-400">Workspace</p>
          <p className="mt-3 text-xl font-semibold">{workspace.name}</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <p className="text-sm text-slate-400">Plan</p>
          <p className="mt-3 text-xl font-semibold capitalize">
            {workspace.plan || "free"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <p className="text-sm text-slate-400">Your Role</p>
          <p className="mt-3 text-xl font-semibold capitalize">{role}</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <p className="text-sm text-slate-400">Channel</p>
          <p className="mt-3 text-xl font-semibold">General</p>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
        <div className="mb-6 flex flex-col gap-4 border-b border-slate-800 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">
              Workspace General
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Share updates, plans, and team discussion here.
            </p>
          </div>

          <div className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300">
            Live conversation
          </div>
        </div>

        <div className="flex h-[65vh] flex-col overflow-hidden rounded-2xl border border-slate-800 bg-zinc-950/60">
          <div className="flex-1 overflow-y-auto p-4 sm:p-5">
            {groupedMessages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <div className="max-w-md text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300">
                    💬
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-white">
                    No messages yet
                  </h3>
                  <p className="mt-2 text-sm text-slate-400">
                    Start the workspace conversation with your first message.
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
                                  {isOwnMessage ? "You" : getSenderName(sender)}
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
                  if (!socket || !conversation?._id) return;

                  socket.emit("typing_start", {
                    conversationId: conversation._id,
                  });

                  if (typingTimeoutRef.current) {
                    clearTimeout(typingTimeoutRef.current);
                  }

                  typingTimeoutRef.current = setTimeout(() => {
                    socket.emit("typing_stop", {
                      conversationId: conversation._id,
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
                placeholder="Write a message to the workspace..."
                className="min-h-[56px] flex-1 resize-none rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-500"
              />

              <button
                onClick={handleSendMessage}
                disabled={isSending || !messageText.trim()}
                className="rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSending ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
