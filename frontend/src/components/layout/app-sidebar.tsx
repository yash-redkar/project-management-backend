"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Boxes,
  FolderKanban,
  CheckSquare,
  MessageSquare,
  Bell,
  Activity,
  CalendarDays,
  Settings,
  ChevronDown,
} from "lucide-react";
import { getTotalUnreadCount } from "@/lib/chat-unread";

function navClass(isActive: boolean) {
  return `mx-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 ${
    isActive
      ? "bg-indigo-500/15 text-white shadow-[0_0_0_1px_rgba(99,102,241,0.15)]"
      : "text-slate-400 hover:bg-slate-900/70 hover:text-white"
  }`;
}

function getInitials(user: any) {
  const name = user?.fullname || user?.fullName || user?.username || "U";

  const parts = String(name).trim().split(" ").filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return String(name).slice(0, 2).toUpperCase();
}

function getCurrentWorkspaceId(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);

  if (segments[0] === "workspaces" && segments[1]) {
    return segments[1];
  }

  return "";
}

export function AppSidebar({
  className,
  onNavigate,
  user,
}: {
  className?: string;
  onNavigate?: () => void;
  user: any;
}) {
  const pathname = usePathname();

  const [savedWorkspaceId, setSavedWorkspaceId] = useState("");
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);

  useEffect(() => {
    const existing = localStorage.getItem("teamforge_active_workspace_id");
    if (existing) {
      setSavedWorkspaceId(existing);
    }
  }, [pathname]);

  useEffect(() => {
    const syncUnread = () => {
      setChatUnreadCount(getTotalUnreadCount());
    };

    syncUnread();

    window.addEventListener("storage", syncUnread);
    window.addEventListener("teamforge-chat-unread-updated", syncUnread);

    return () => {
      window.removeEventListener("storage", syncUnread);
      window.removeEventListener("teamforge-chat-unread-updated", syncUnread);
    };
  }, []);

  useEffect(() => {
    const stored =
      typeof window !== "undefined"
        ? Number(
            localStorage.getItem("teamforge_notification_unread_count") || "0",
          )
        : 0;

    setNotificationUnreadCount(stored);

    const syncNotifications = (event: Event) => {
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

    window.addEventListener(
      "teamforge-notifications-updated",
      syncNotifications,
    );

    return () => {
      window.removeEventListener(
        "teamforge-notifications-updated",
        syncNotifications,
      );
    };
  }, []);

  const workspaceIdFromRoute = getCurrentWorkspaceId(pathname);
  const activeWorkspaceId = workspaceIdFromRoute || savedWorkspaceId;

  const projectsHref = activeWorkspaceId
    ? `/workspaces/${activeWorkspaceId}/projects`
    : "/workspaces";

  const chatHref = activeWorkspaceId
    ? `/workspaces/${activeWorkspaceId}/chat`
    : "/workspaces";

  const activityHref = activeWorkspaceId
    ? `/workspaces/${activeWorkspaceId}/activity`
    : "/workspaces";

  const calendarHref = activeWorkspaceId
    ? `/workspaces/${activeWorkspaceId}/calendar`
    : "/workspaces";

  const mainNav = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Workspaces", href: "/workspaces", icon: Boxes },
    { label: "Projects", href: projectsHref, icon: FolderKanban },
    { label: "Tasks", href: "/tasks", icon: CheckSquare },
    { label: "Chat", href: chatHref, icon: MessageSquare },
  ];

  const toolsNav = [
    { label: "Calendar", href: calendarHref, icon: CalendarDays },
    { label: "Activity", href: activityHref, icon: Activity },
    { label: "Notifications", href: "/notifications", icon: Bell },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  const displayName =
    user?.fullname || user?.fullName || user?.username || "User";
  const email = user?.email || "No email";
  const initials = getInitials(user);

  const isProjectRoute =
    pathname === "/projects" ||
    pathname.includes("/projects/") ||
    /\/workspaces\/[^/]+\/projects(\/.*)?$/.test(pathname);

  const isWorkspaceRoute =
    pathname === "/workspaces" ||
    (pathname.startsWith("/workspaces") &&
      !pathname.includes("/projects") &&
      !pathname.endsWith("/chat") &&
      !pathname.includes("/activity") &&
      !pathname.includes("/calendar"));

  const isTaskRoute =
    pathname === "/tasks" ||
    pathname.startsWith("/tasks/") ||
    /\/workspaces\/[^/]+\/projects\/[^/]+\/tasks(\/.*)?$/.test(pathname);

  const isChatRoute =
    pathname === "/chat" ||
    pathname.startsWith("/chat/") ||
    /\/workspaces\/[^/]+\/chat$/.test(pathname) ||
    /\/workspaces\/[^/]+\/projects\/[^/]+\/chat$/.test(pathname);

  const isActivityRoute =
    pathname === "/activity" ||
    pathname.startsWith("/activity/") ||
    /\/workspaces\/[^/]+\/activity$/.test(pathname);

  const isCalendarRoute =
    pathname === "/calendar" ||
    pathname.startsWith("/calendar/") ||
    /\/workspaces\/[^/]+\/calendar$/.test(pathname);

  const isNotificationsRoute =
    pathname === "/notifications" || pathname.startsWith("/notifications/");

  return (
    <aside
      className={`h-full flex-col overflow-hidden border-r border-slate-800 bg-[var(--app-surface)] backdrop-blur-xl ${className ?? ""}`}
    >
      <div className="flex items-center gap-3 px-4 py-4">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-2xl text-white shadow-[0_8px_20px_rgba(14,165,233,0.22)]"
          style={{
            backgroundColor: "#0ea5e9",
            backgroundImage:
              "linear-gradient(135deg, #06b6d4 0%, #2563eb 100%)",
          }}
        >
          T
        </div>
        <div>
          <p className="text-sm font-semibold text-white">TeamForge</p>
          <p className="text-xs text-slate-400">Project command center</p>
        </div>
      </div>

      <div className="px-4">
        <button className="w-full rounded-2xl border border-slate-800 bg-[var(--app-surface-2)] p-3 text-left transition hover:bg-slate-800/80">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Workspace
              </p>
              <p className="mt-1 truncate text-sm font-medium text-white">
                My Workspace
              </p>
              <p className="text-xs text-slate-400">
                {activeWorkspaceId ? "Selected" : "No workspace selected"}
              </p>
            </div>

            <ChevronDown className="size-4 shrink-0 text-slate-500" />
          </div>
        </button>
      </div>

      <div className="mt-4 flex-1 overflow-y-auto px-2 pb-4">
        <p className="mb-3 px-4 text-xs uppercase tracking-[0.2em] text-slate-500">
          Navigate
        </p>

        <nav className="space-y-1">
          {mainNav.map((item) => {
            const Icon = item.icon;

            let isActive = false;

            if (item.label === "Dashboard") {
              isActive = pathname === "/dashboard";
            } else if (item.label === "Workspaces") {
              isActive = isWorkspaceRoute;
            } else if (item.label === "Projects") {
              isActive = isProjectRoute;
            } else if (item.label === "Tasks") {
              isActive = isTaskRoute;
            } else if (item.label === "Chat") {
              isActive = isChatRoute;
            } else {
              isActive = pathname.startsWith(item.href);
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onNavigate}
                className={navClass(isActive)}
              >
                <Icon className="size-4" />

                <div className="flex w-full items-center justify-between">
                  <span>{item.label}</span>

                  {item.label === "Chat" && chatUnreadCount > 0 ? (
                    <span className="ml-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium text-cyan-300">
                      {chatUnreadCount > 99 ? "99+" : chatUnreadCount}
                    </span>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </nav>

        <p className="mb-3 mt-4 px-4 text-xs uppercase tracking-[0.2em] text-slate-500">
          Tools
        </p>

        <nav className="space-y-1">
          {toolsNav.map((item) => {
            const Icon = item.icon;

            let isActive = false;

            if (item.label === "Calendar") {
              isActive = isCalendarRoute;
            } else if (item.label === "Activity") {
              isActive = isActivityRoute;
            } else if (item.label === "Notifications") {
              isActive = isNotificationsRoute;
            } else {
              isActive = pathname.startsWith(item.href);
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onNavigate}
                className={navClass(isActive)}
              >
                <Icon className="size-4" />

                <div className="flex w-full items-center justify-between">
                  <span>{item.label}</span>

                  {item.label === "Notifications" &&
                  notificationUnreadCount > 0 ? (
                    <span className="ml-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium text-cyan-300">
                      {notificationUnreadCount > 99
                        ? "99+"
                        : notificationUnreadCount}
                    </span>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-slate-800 px-4 py-4">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-[var(--app-surface-2)] p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-indigo-500 text-sm font-semibold text-white">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">
              {displayName}
            </p>
            <p className="truncate text-xs text-slate-400">{email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
