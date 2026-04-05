"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, Menu, Search, Sparkles } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { UserMenu } from "./user-menu";
import { notificationService } from "@/services/notification.service";
import {
  getPrimaryUnreadChatTarget,
  getTotalUnreadCount,
} from "@/lib/chat-unread";

function getPageTitle(pathname: string) {
  if (pathname === "/dashboard") return "Dashboard";

  if (pathname.includes("/projects/")) return "Project Details";
  if (pathname === "/projects") return "Projects";

  if (pathname.startsWith("/workspaces/") && pathname.includes("/activity")) {
    return "Activity";
  }

  if (pathname.startsWith("/workspaces/") && pathname.includes("/chat")) {
    return "Chat";
  }

  if (pathname.startsWith("/workspaces/")) return "Workspace Details";
  if (pathname === "/workspaces") return "Workspaces";

  if (pathname.startsWith("/tasks/")) return "Task Details";
  if (pathname === "/tasks") return "Tasks";

  if (pathname === "/chat") return "Chat";
  if (pathname === "/calendar") return "Calendar";
  if (pathname === "/activity") return "Activity";
  if (pathname === "/notifications") return "Notifications";
  if (pathname === "/settings") return "Settings";

  return "Dashboard";
}

function cleanMessage(message: string) {
  if (!message) return "Notification";
  return message.replace(/_/g, " ").replace(/\s+/g, " ").trim();
}

function formatRelativeTime(dateString: string) {
  if (!dateString) return "";

  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return "Just now";
  if (diffMs < hour) return `${Math.floor(diffMs / minute)} min ago`;
  if (diffMs < day) {
    const hrs = Math.floor(diffMs / hour);
    return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  }
  if (diffMs < 2 * day) return "Yesterday";
  if (diffMs < 7 * day) {
    const days = Math.floor(diffMs / day);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }

  return new Date(dateString).toLocaleDateString();
}

function getInitialsFromUser(notification: any) {
  const name =
    notification?.actor?.fullName ||
    notification?.actor?.fullname ||
    notification?.actor?.name ||
    notification?.actor?.username ||
    notification?.actor?.email ||
    "";

  if (!name) return "NA";

  const parts = String(name).trim().split(" ").filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return String(name).slice(0, 2).toUpperCase();
}

function getNotificationHref(notification: any) {
  const workspaceId = notification?.workspace?._id;
  const projectId = notification?.project?._id;
  const taskId = notification?.task?._id;

  if (taskId && workspaceId && projectId) {
    return `/tasks/${taskId}?workspaceId=${workspaceId}&projectId=${projectId}`;
  }

  if (projectId && workspaceId) {
    return `/workspaces/${workspaceId}/projects/${projectId}`;
  }

  if (workspaceId) {
    return `/workspaces/${workspaceId}`;
  }

  return "/notifications";
}

function getNotificationBadgeClass(type: string, message: string) {
  const value = (type || "").toLowerCase();
  const msg = (message || "").toLowerCase();

  if (value.includes("comment") || msg.includes("comment")) {
    return "bg-cyan-500/10 text-cyan-300";
  }

  if (
    value.includes("assign") ||
    value.includes("member") ||
    value.includes("invite") ||
    msg.includes("assigned") ||
    msg.includes("member") ||
    msg.includes("invite")
  ) {
    return "bg-slate-700/80 text-slate-300";
  }

  if (value.includes("project") || msg.includes("project")) {
    return "bg-violet-500/10 text-violet-300";
  }

  if (
    value.includes("file") ||
    value.includes("attachment") ||
    msg.includes("file") ||
    msg.includes("attachment")
  ) {
    return "bg-slate-700/80 text-slate-300";
  }

  if (
    value.includes("done") ||
    value.includes("complete") ||
    msg.includes("done") ||
    msg.includes("completed")
  ) {
    return "bg-emerald-500/10 text-emerald-300";
  }

  return "bg-indigo-500/10 text-indigo-300";
}

export function AppNavbar({
  onOpenSidebar,
  onOpenSearch,
  onOpenAssistant,
  user,
}: {
  onOpenSidebar: () => void;
  onOpenSearch: () => void;
  onOpenAssistant: () => void;
  user: any;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const pageTitle = getPageTitle(pathname);

  const getWorkspaceIdForProjectCreation = () => {
    const workspaceMatch = pathname.match(/^\/workspaces\/([^/]+)/);
    const fromPath = workspaceMatch?.[1];

    if (fromPath) return fromPath;

    if (typeof window !== "undefined") {
      return localStorage.getItem("teamforge_active_workspace_id") || "";
    }

    return "";
  };

  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [chatUnreadTargetHref, setChatUnreadTargetHref] =
    useState("/workspaces");
  const [chatUnreadTargetLabel, setChatUnreadTargetLabel] =
    useState("New chat messages");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  const notificationsRef = useRef<HTMLDivElement | null>(null);

  const syncUnreadState = (count: number) => {
    setNotificationUnreadCount(count);

    if (typeof window !== "undefined") {
      localStorage.setItem(
        "teamforge_notification_unread_count",
        String(count),
      );
      window.dispatchEvent(
        new CustomEvent("teamforge-notifications-updated", {
          detail: { unreadCount: count },
        }),
      );
    }
  };

  const loadNotifications = async () => {
    try {
      setIsLoadingNotifications(true);

      const res = await notificationService.getNotifications(6);
      const count = Number(res?.data?.unreadCount) || 0;
      const items = Array.isArray(res?.data?.notifications)
        ? res.data.notifications
        : [];

      setNotifications(items);
      syncUnreadState(count);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  useEffect(() => {
    const stored =
      typeof window !== "undefined"
        ? Number(
            localStorage.getItem("teamforge_notification_unread_count") || "0",
          )
        : 0;

    setNotificationUnreadCount(stored);

    const syncUnread = (event: Event) => {
      const customEvent = event as CustomEvent<{ unreadCount?: number }>;
      const count = Number(customEvent.detail?.unreadCount) || 0;
      setNotificationUnreadCount(count);

      if (typeof window !== "undefined") {
        localStorage.setItem(
          "teamforge_notification_unread_count",
          String(count),
        );
      }
    };

    window.addEventListener("teamforge-notifications-updated", syncUnread);

    return () => {
      window.removeEventListener("teamforge-notifications-updated", syncUnread);
    };
  }, []);

  useEffect(() => {
    const syncChatUnread = () => {
      setChatUnreadCount(getTotalUnreadCount());

      const target = getPrimaryUnreadChatTarget();
      if (target?.href) {
        setChatUnreadTargetHref(target.href);
      } else {
        setChatUnreadTargetHref("/workspaces");
      }

      if (target?.label) {
        setChatUnreadTargetLabel(target.label);
      } else {
        setChatUnreadTargetLabel("New chat messages");
      }
    };

    syncChatUnread();

    window.addEventListener("storage", syncChatUnread);
    window.addEventListener("teamforge-chat-unread-updated", syncChatUnread);

    return () => {
      window.removeEventListener("storage", syncChatUnread);
      window.removeEventListener(
        "teamforge-chat-unread-updated",
        syncChatUnread,
      );
    };
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const previewNotifications = useMemo(() => {
    return notifications.slice(0, 4);
  }, [notifications]);

  const handleBellClick = async () => {
    const nextOpen = !isNotificationsOpen;
    setIsNotificationsOpen(nextOpen);

    if (nextOpen && notifications.length === 0) {
      await loadNotifications();
    }
  };

  const handleNotificationClick = async (notification: any) => {
    try {
      if (!notification?.isRead && notification?._id) {
        await notificationService.markAsRead(notification._id);

        setNotifications((prev) =>
          prev.map((item) =>
            item._id === notification._id ? { ...item, isRead: true } : item,
          ),
        );

        syncUnreadState(Math.max(0, notificationUnreadCount - 1));
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    } finally {
      setIsNotificationsOpen(false);
      router.push(getNotificationHref(notification));
    }
  };

  const totalUnreadBadgeCount = notificationUnreadCount + chatUnreadCount;

  const handleNewProjectClick = () => {
    const workspaceId = getWorkspaceIdForProjectCreation();

    if (workspaceId) {
      router.push(`/workspaces/${workspaceId}/projects`);
      return;
    }

    router.push("/workspaces");
  };

  return (
    <header className="sticky top-0 z-20 border-b border-slate-800 bg-[var(--app-surface)] backdrop-blur-xl">
      <div className="px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenSidebar}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-200 lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu className="size-5" />
            </button>

            <div className="hidden md:block">
              <h1 className="text-2xl font-semibold tracking-tight text-white">
                {pageTitle}
              </h1>
            </div>
          </div>

          <div className="flex flex-1 items-center justify-end gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onOpenSearch}
              className="relative hidden w-full max-w-[320px] md:block"
            >
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
              <div className="flex h-11 w-full items-center rounded-2xl border border-slate-800 bg-slate-900/70 pl-10 pr-16 text-left text-sm text-slate-500 transition hover:border-cyan-500/40 hover:bg-slate-900">
                Search anything...
              </div>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-lg border border-slate-700 bg-zinc-950 px-2 py-1 text-[10px] font-medium text-slate-400">
                Ctrl + K
              </div>
            </button>

            <button
              onClick={onOpenAssistant}
              className="hidden items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800 md:inline-flex"
            >
              <Sparkles className="size-4 text-violet-400" />
              AI Assistant
            </button>

            <button
              type="button"
              onClick={handleNewProjectClick}
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-cyan-500/10 transition hover:brightness-110"
            >
              + New Project
            </button>

            <div className="relative" ref={notificationsRef}>
              <button
                onClick={handleBellClick}
                className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-300 transition hover:bg-slate-800"
                aria-label="Notifications"
              >
                <Bell className="size-5" />
                {totalUnreadBadgeCount > 0 ? (
                  <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-cyan-500 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white ring-2 ring-zinc-950">
                    {totalUnreadBadgeCount > 99 ? "99+" : totalUnreadBadgeCount}
                  </span>
                ) : null}
              </button>

              {isNotificationsOpen ? (
                <div className="absolute right-0 top-14 z-50 w-[340px] rounded-2xl border border-slate-800 bg-zinc-950/95 p-3 shadow-2xl shadow-black/40 backdrop-blur-xl">
                  <div className="px-2 pb-2">
                    <h3 className="text-sm font-semibold text-white">
                      Notifications
                    </h3>
                  </div>

                  {chatUnreadCount > 0 ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsNotificationsOpen(false);
                        router.push(chatUnreadTargetHref);
                      }}
                      className="mb-1 flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-slate-900/70"
                    >
                      <div className="relative shrink-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-sm font-semibold text-white">
                          CH
                        </div>

                        <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-cyan-500/20" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">
                          {chatUnreadTargetLabel}
                        </p>

                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-xs text-slate-500">
                            Just now
                          </span>
                          <span className="text-xs font-medium text-slate-300">
                            +{chatUnreadCount > 99 ? "99" : chatUnreadCount}
                          </span>
                        </div>
                      </div>
                    </button>
                  ) : null}

                  <div className="space-y-1">
                    {isLoadingNotifications ? (
                      <div className="rounded-xl px-3 py-6 text-center text-sm text-slate-400">
                        Loading notifications...
                      </div>
                    ) : previewNotifications.length === 0 ? (
                      <div className="rounded-xl px-3 py-6 text-center text-sm text-slate-400">
                        No notifications yet
                      </div>
                    ) : (
                      previewNotifications.map((item: any, index: number) => {
                        const message = cleanMessage(item?.message || "");
                        const projectName = item?.project?.name || "";
                        const initials = getInitialsFromUser(item);
                        const badgeClass = getNotificationBadgeClass(
                          item?.type || "",
                          item?.message || "",
                        );

                        return (
                          <button
                            key={item._id || index}
                            type="button"
                            onClick={() => handleNotificationClick(item)}
                            className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-slate-900/70"
                          >
                            <div className="relative shrink-0">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-sm font-semibold text-white">
                                {initials}
                              </div>

                              <div
                                className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full ${badgeClass}`}
                              />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-white">
                                {message}
                              </p>

                              {projectName ? (
                                <p className="mt-0.5 truncate text-xs text-slate-400">
                                  {projectName}
                                </p>
                              ) : null}

                              <div className="mt-1 flex items-center gap-2">
                                <span className="text-xs text-slate-500">
                                  {formatRelativeTime(item.createdAt)}
                                </span>

                                {!item?.isRead ? (
                                  <span className="text-xs font-medium text-slate-300">
                                    New
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>

                  <div className="mt-2 border-t border-slate-800 pt-2">
                    <Link
                      href="/notifications"
                      onClick={() => setIsNotificationsOpen(false)}
                      className="block rounded-xl px-3 py-2 text-center text-sm font-medium text-slate-300 transition hover:bg-slate-900/70 hover:text-white"
                    >
                      View all notifications
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>

            <UserMenu user={user} />
          </div>
        </div>

        <div className="mt-3 md:hidden">
          <div className="mb-2">
            <h1 className="text-xl font-semibold text-white">{pageTitle}</h1>
          </div>

          <button
            type="button"
            onClick={onOpenSearch}
            className="relative w-full"
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
            <div className="flex h-11 w-full items-center rounded-2xl border border-slate-800 bg-slate-900/70 pl-10 pr-4 text-left text-sm text-slate-500">
              Search anything...
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
