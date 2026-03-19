"use client";

import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { getSocket } from "@/lib/socket";

type NotificationPayload = {
  _id: string;
  type?: string;
  message?: string;
  workspace?: string | { _id?: string; name?: string };
  project?: string | { _id?: string; name?: string };
  task?: string | { _id?: string; title?: string };
  meta?: Record<string, any>;
  createdAt?: string;
};

function getCurrentUnreadCount() {
  if (typeof window === "undefined") return 0;
  return Number(
    localStorage.getItem("taskforge_notification_unread_count") || "0",
  );
}

function setCurrentUnreadCount(count: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem("taskforge_notification_unread_count", String(count));

  window.dispatchEvent(
    new CustomEvent("taskforge-notifications-updated", {
      detail: { unreadCount: count },
    }),
  );
}

function extractWorkspaceId(payload: NotificationPayload) {
  if (!payload?.workspace) return "";
  if (typeof payload.workspace === "string") return payload.workspace;
  return payload.workspace?._id || "";
}

function extractProjectId(payload: NotificationPayload) {
  if (!payload?.project) return "";
  if (typeof payload.project === "string") return payload.project;
  return payload.project?._id || "";
}

function extractTaskId(payload: NotificationPayload) {
  if (!payload?.task) return "";
  if (typeof payload.task === "string") return payload.task;
  return payload.task?._id || "";
}

function getNotificationHref(payload: NotificationPayload) {
  const workspaceId = extractWorkspaceId(payload);
  const projectId = extractProjectId(payload);
  const taskId = extractTaskId(payload);

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

export function GlobalNotificationListener() {
  const pathname = usePathname();
  const { user } = useAuth();
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!user?._id) return;

    const socket = getSocket();
    if (!socket) return;

    const handleNotification = (payload: NotificationPayload) => {
      const nextCount = getCurrentUnreadCount() + 1;
      setCurrentUnreadCount(nextCount);

      const href = getNotificationHref(payload);
      const message = payload?.message || "You received a new notification";

      if (pathname !== "/notifications") {
        toast(
          (t) => (
            <div className="flex max-w-sm items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-cyan-500/15 text-sm font-semibold text-cyan-300">
                N
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">
                  New notification
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-300">
                  {message}
                </p>

                <div className="mt-3 flex items-center gap-2">
                  <a
                    href={href}
                    className="rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-cyan-400"
                  >
                    View
                  </a>

                  <button
                    onClick={() => toast.dismiss(t.id)}
                    className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-800"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          ),
          {
            duration: 4500,
            style: {
              background: "#09090b",
              border: "1px solid #1e293b",
              color: "#fff",
            },
          },
        );
      }
    };

    if (!mountedRef.current) {
      socket.on("notification", handleNotification);
      mountedRef.current = true;
    }

    return () => {
      socket.off("notification", handleNotification);
      mountedRef.current = false;
    };
  }, [user?._id, pathname]);

  return null;
}
