"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  CheckCheck,
  CheckCircle2,
  FileEdit,
  FolderPlus,
  GitBranch,
  Loader2,
  MessageSquare,
  Search,
  UserPlus,
} from "lucide-react";
import { notificationService } from "@/services/notification.service";

function cleanMessage(message: string) {
  if (!message) return "Notification";
  return message.replace(/_/g, " ").replace(/\s+/g, " ").trim();
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

function getDateGroup(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(todayStart.getDate() - 1);

  const itemDateStart = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  if (itemDateStart.getTime() === todayStart.getTime()) return "Today";
  if (itemDateStart.getTime() === yesterdayStart.getTime()) return "Yesterday";

  return itemDateStart.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year:
      itemDateStart.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function getNotificationIconMeta(type: string, message: string) {
  const value = (type || "").toLowerCase();
  const msg = (message || "").toLowerCase();

  if (value.includes("comment") || msg.includes("comment")) {
    return {
      icon: MessageSquare,
      className: "bg-cyan-500/10 text-cyan-300",
    };
  }

  if (
    value.includes("assign") ||
    value.includes("member") ||
    value.includes("invite") ||
    msg.includes("assigned") ||
    msg.includes("member") ||
    msg.includes("invite")
  ) {
    return {
      icon: UserPlus,
      className: "bg-slate-700/80 text-slate-300",
    };
  }

  if (value.includes("project") || msg.includes("project")) {
    return {
      icon: FolderPlus,
      className: "bg-violet-500/10 text-violet-300",
    };
  }

  if (
    value.includes("file") ||
    value.includes("attachment") ||
    msg.includes("file") ||
    msg.includes("attachment")
  ) {
    return {
      icon: FileEdit,
      className: "bg-slate-700/80 text-slate-300",
    };
  }

  if (
    value.includes("done") ||
    value.includes("complete") ||
    msg.includes("done") ||
    msg.includes("completed")
  ) {
    return {
      icon: CheckCircle2,
      className: "bg-emerald-500/10 text-emerald-300",
    };
  }

  return {
    icon: GitBranch,
    className: "bg-indigo-500/10 text-indigo-300",
  };
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

  return "";
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const syncUnreadCount = (count: number) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "taskforge_notification_unread_count",
        String(count),
      );
      window.dispatchEvent(
        new CustomEvent("taskforge-notifications-updated", {
          detail: { unreadCount: count },
        }),
      );
    }
  };

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const res = await notificationService.getNotifications(50);

      const payload = res?.data || {};
      const items = Array.isArray(payload.notifications)
        ? payload.notifications
        : [];

      setNotifications(items);
      setUnreadCount(Number(payload.unreadCount) || 0);
    } catch (err: any) {
      console.error("Failed to load notifications:", err);
      toast.error(
        err?.response?.data?.message || "Failed to load notifications",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    syncUnreadCount(unreadCount);
  }, [unreadCount]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((item: any) => {
      const message = cleanMessage(item?.message || "");
      const projectName = item?.project?.name || "";
      const taskTitle = item?.task?.title || "";
      const type = item?.type || "";
      const query = search.toLowerCase().trim();

      return (
        !query ||
        message.toLowerCase().includes(query) ||
        projectName.toLowerCase().includes(query) ||
        taskTitle.toLowerCase().includes(query) ||
        type.toLowerCase().includes(query)
      );
    });
  }, [notifications, search]);

  const groupedNotifications = useMemo(() => {
    return filteredNotifications.reduce(
      (acc: Record<string, any[]>, item: any) => {
        const group = getDateGroup(item.createdAt);
        if (!acc[group]) acc[group] = [];
        acc[group].push(item);
        return acc;
      },
      {},
    );
  }, [filteredNotifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);

      setNotifications((prev) =>
        prev.map((item) =>
          item._id === notificationId ? { ...item, isRead: true } : item,
        ),
      );

      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err: any) {
      console.error("Failed to mark notification as read:", err);
      toast.error(
        err?.response?.data?.message || "Failed to mark notification as read",
      );
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setIsMarkingAll(true);
      await notificationService.markAllAsRead();

      setNotifications((prev) =>
        prev.map((item) => ({ ...item, isRead: true })),
      );
      setUnreadCount(0);

      toast.success("All notifications marked as read");
    } catch (err: any) {
      console.error("Failed to mark all notifications as read:", err);
      toast.error(
        err?.response?.data?.message ||
          "Failed to mark all notifications as read",
      );
    } finally {
      setIsMarkingAll(false);
    }
  };

  return (
    <div className="space-y-6 text-white">
      <div className="flex flex-col gap-4 border-b border-slate-800 pb-6 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">Notifications</h1>
          <p className="mt-2 text-sm text-slate-400">
            Stay updated with task assignments, comments, invites, and project
            activity.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-[260px]">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 w-full rounded-2xl border border-slate-800 bg-slate-950/70 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-slate-700 focus:ring-2 focus:ring-slate-700/30"
            />
          </div>

          <button
            type="button"
            onClick={handleMarkAllAsRead}
            disabled={isMarkingAll || unreadCount === 0}
            className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/70 px-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <CheckCheck className="h-4 w-4" />
            {isMarkingAll ? "Marking..." : "Mark all read"}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8">
          <div className="flex items-center gap-3 text-slate-300">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading notifications...</span>
          </div>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-950/40 px-6 py-14 text-center">
          <h3 className="text-lg font-semibold text-white">
            No notifications found
          </h3>
          <p className="mt-2 text-sm text-slate-400">You’re all caught up.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedNotifications).map(([date, items]) => (
            <div
              key={date}
              className="rounded-3xl border border-slate-800 bg-slate-950/55 p-5"
            >
              <div className="mb-4 flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
                <h2 className="text-base font-semibold text-white">{date}</h2>
                <span className="rounded-full border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-300">
                  {items.length} notifications
                </span>
              </div>

              <div className="space-y-1">
                {items.map((item: any, index: number) => {
                  const message = cleanMessage(item?.message || "");
                  const projectName = item?.project?.name || "";
                  const taskTitle = item?.task?.title || "";
                  const href = getNotificationHref(item);
                  const initials = getInitialsFromUser(item);

                  const { icon: Icon, className } = getNotificationIconMeta(
                    item?.type || "",
                    item?.message || "",
                  );

                  const row = (
                    <div
                      className={`group flex items-start gap-4 rounded-2xl px-3 py-4 transition hover:bg-slate-900/45 ${
                        !item.isRead ? "bg-slate-900/20" : ""
                      }`}
                    >
                      <div className="relative shrink-0">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-sm font-semibold text-white">
                          {initials}
                        </div>

                        <div
                          className={`absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full ${className}`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-6 text-slate-300">
                          <span
                            className={
                              !item.isRead ? "font-semibold text-white" : ""
                            }
                          >
                            {message}
                          </span>
                          {projectName ? (
                            <>
                              <span className="text-slate-500"> in </span>
                              <span className="font-medium text-slate-400">
                                {projectName}
                              </span>
                            </>
                          ) : null}
                        </p>

                        {taskTitle ? (
                          <p className="mt-1 text-sm text-slate-300">
                            {taskTitle}
                          </p>
                        ) : null}

                        <div className="mt-2 flex items-center gap-3">
                          <p className="text-xs text-slate-500">
                            {formatRelativeTime(item.createdAt)}
                          </p>

                          {!item.isRead ? (
                            <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                              Unread
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {!item.isRead ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleMarkAsRead(item._id);
                          }}
                          className="shrink-0 rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-800"
                        >
                          Mark read
                        </button>
                      ) : null}
                    </div>
                  );

                  if (href) {
                    return (
                      <Link
                        key={item._id || index}
                        href={href}
                        className="block"
                      >
                        {row}
                      </Link>
                    );
                  }

                  return <div key={item._id || index}>{row}</div>;
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
