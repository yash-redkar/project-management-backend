"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  Calendar,
  CheckCircle2,
  FileEdit,
  Filter,
  FolderPlus,
  GitBranch,
  Loader2,
  MessageSquare,
  Search,
  UserPlus,
} from "lucide-react";
import { activityService } from "@/services/activity.service";

function getInitials(name: string) {
  const parts = String(name || "U")
    .trim()
    .split(" ")
    .filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return String(name || "U")
    .slice(0, 2)
    .toUpperCase();
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

function cleanMessage(message: string) {
  if (!message) return "Activity recorded";
  return message.replace(/_/g, " ").replace(/\s+/g, " ").trim();
}

function getActivityIconMeta(
  action: string,
  entityType: string,
  message: string,
) {
  const actionValue = (action || "").toLowerCase();
  const entityValue = (entityType || "").toLowerCase();
  const messageValue = (message || "").toLowerCase();

  if (
    actionValue.includes("complete") ||
    messageValue.includes("completed") ||
    messageValue.includes("done")
  ) {
    return {
      icon: CheckCircle2,
      className: "bg-emerald-500/10 text-emerald-300",
    };
  }

  if (actionValue.includes("comment") || messageValue.includes("comment")) {
    return {
      icon: MessageSquare,
      className: "bg-cyan-500/10 text-cyan-300",
    };
  }

  if (actionValue.includes("project") || entityValue === "project") {
    return {
      icon: FolderPlus,
      className: "bg-violet-500/10 text-violet-300",
    };
  }

  if (
    entityValue === "member" ||
    entityValue === "invite" ||
    messageValue.includes("member") ||
    messageValue.includes("invite")
  ) {
    return {
      icon: UserPlus,
      className: "bg-slate-700/80 text-slate-300",
    };
  }

  if (
    actionValue.includes("file") ||
    actionValue.includes("attachment") ||
    messageValue.includes("file") ||
    messageValue.includes("attachment")
  ) {
    return {
      icon: FileEdit,
      className: "bg-slate-700/80 text-slate-300",
    };
  }

  return {
    icon: GitBranch,
    className: "bg-indigo-500/10 text-indigo-300",
  };
}

function getActivityHref(activity: any, workspaceId: string) {
  const projectId = activity?.project?._id;
  const taskId = activity?.task?._id;

  if (taskId && projectId) {
    return `/tasks/${taskId}?workspaceId=${workspaceId}&projectId=${projectId}`;
  }

  if (projectId) {
    return `/workspaces/${workspaceId}/projects/${projectId}`;
  }

  return "";
}

export default function WorkspaceActivityPage() {
  const params = useParams();

  const workspaceId =
    typeof params.workspaceId === "string"
      ? params.workspaceId
      : Array.isArray(params.workspaceId)
        ? params.workspaceId[0]
        : "";

  const [activities, setActivities] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(12);

  const loadActivities = async () => {
    if (!workspaceId) return;

    try {
      setIsLoading(true);

      const res = await activityService.getWorkspaceActivity(workspaceId, 50);
      const items = Array.isArray(res?.data) ? res.data : [];

      const filtered = items.filter((activity: any) => {
        const action = (activity.action || "").toLowerCase();
        const message = (activity.message || "").toLowerCase();

        return !(
          action === "comment_updated" || message.includes("comment updated")
        );
      });

      setActivities(filtered);
    } catch (err: any) {
      console.error("Failed to load workspace activity:", err);
      toast.error(
        err?.response?.data?.message || "Failed to load workspace activity",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, [workspaceId]);

  useEffect(() => {
    setVisibleCount(12);
  }, [search, typeFilter, dateRange]);

  const filteredActivities = useMemo(() => {
    return activities.filter((activity: any) => {
      const actorName =
        activity?.actor?.fullname ||
        activity?.actor?.fullName ||
        activity?.actor?.name ||
        activity?.actor?.username ||
        "Someone";

      const taskTitle = activity?.task?.title || "";
      const projectName = activity?.project?.name || "";
      const message = cleanMessage(activity?.message || "");
      const entityType = activity?.entityType || "";

      const matchesSearch =
        !search.trim() ||
        actorName.toLowerCase().includes(search.toLowerCase()) ||
        taskTitle.toLowerCase().includes(search.toLowerCase()) ||
        projectName.toLowerCase().includes(search.toLowerCase()) ||
        message.toLowerCase().includes(search.toLowerCase()) ||
        entityType.toLowerCase().includes(search.toLowerCase());

      const matchesType =
        typeFilter === "all" ||
        (activity?.entityType || "").toLowerCase() === typeFilter;

      const createdAt = activity?.createdAt
        ? new Date(activity.createdAt).getTime()
        : 0;

      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;

      let matchesDate = true;

      if (dateRange === "today") {
        const today = new Date();
        const startOfToday = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
        ).getTime();

        matchesDate = createdAt >= startOfToday;
      } else if (dateRange === "7days") {
        matchesDate = createdAt >= now - 7 * oneDay;
      } else if (dateRange === "30days") {
        matchesDate = createdAt >= now - 30 * oneDay;
      }

      return matchesSearch && matchesType && matchesDate;
    });
  }, [activities, search, typeFilter, dateRange]);

  const visibleActivities = useMemo(() => {
    return filteredActivities.slice(0, visibleCount);
  }, [filteredActivities, visibleCount]);

  const groupedActivities = useMemo(() => {
    return visibleActivities.reduce(
      (acc: Record<string, any[]>, activity: any) => {
        const group = getDateGroup(activity.createdAt);

        if (!acc[group]) {
          acc[group] = [];
        }

        acc[group].push(activity);
        return acc;
      },
      {},
    );
  }, [visibleActivities]);

  const hasMore = visibleCount < filteredActivities.length;

  return (
    <div className="space-y-6 text-[var(--app-text)]">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 xl:flex-row xl:items-center xl:justify-between dark:border-slate-800">
        <div>
          <h1 className="text-3xl font-semibold text-[var(--app-text)]">
            Activity
          </h1>
          <p className="mt-2 text-sm text-[var(--app-muted)]">
            Track what your team has been working on across this workspace.
          </p>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-[260px]">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search activity..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 w-full rounded-2xl border border-slate-200 bg-[var(--app-surface-2)] pl-11 pr-4 text-sm text-[var(--app-text)] placeholder:text-[var(--app-muted)] outline-none transition focus:border-cyan-500/40 focus:ring-2 focus:ring-cyan-500/10 dark:border-slate-800"
            />
          </div>

          <div className="relative">
            <Filter className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-11 appearance-none rounded-2xl border border-slate-200 bg-[var(--app-surface-2)] pl-11 pr-10 text-sm text-[var(--app-text)] outline-none transition focus:border-cyan-500/40 focus:ring-2 focus:ring-cyan-500/10 dark:border-slate-800"
            >
              <option value="all">All types</option>
              <option value="workspace">Workspace</option>
              <option value="project">Project</option>
              <option value="task">Task</option>
              <option value="member">Member</option>
              <option value="invite">Invite</option>
            </select>
          </div>

          <div className="relative">
            <Calendar className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="h-11 appearance-none rounded-2xl border border-slate-200 bg-[var(--app-surface-2)] pl-11 pr-10 text-sm text-[var(--app-text)] outline-none transition focus:border-cyan-500/40 focus:ring-2 focus:ring-cyan-500/10 dark:border-slate-800"
            >
              <option value="all">All time</option>
              <option value="today">Today</option>
              <option value="7days">Last 7 days</option>
              <option value="30days">Last 30 days</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-3xl border border-slate-200 bg-[var(--app-surface)] p-8 dark:border-slate-800">
          <div className="flex items-center gap-3 text-[var(--app-text)]">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading activity...</span>
          </div>
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-[var(--app-surface)] px-6 py-14 text-center dark:border-slate-800">
          <h3 className="text-lg font-semibold text-[var(--app-text)]">
            No activity found
          </h3>
          <p className="mt-2 text-sm text-[var(--app-muted)]">
            Try a different search term or filter.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {Object.entries(groupedActivities).map(([date, items]) => (
              <div
                key={date}
                className="rounded-3xl border border-slate-200 bg-[var(--app-surface)] p-5 dark:border-slate-800"
              >
                <div className="mb-4 flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
                  <h2 className="text-base font-semibold text-[var(--app-text)]">
                    {date}
                  </h2>
                  <span className="rounded-full border border-slate-200 bg-[var(--app-surface-2)] px-2.5 py-1 text-xs font-medium text-[var(--app-text)] dark:border-slate-800">
                    {items.length} activities
                  </span>
                </div>

                <div className="space-y-1">
                  {items.map((activity: any, index: number) => {
                    const actorName =
                      activity?.actor?.fullname ||
                      activity?.actor?.fullName ||
                      activity?.actor?.name ||
                      activity?.actor?.username ||
                      "Someone";

                    const message = cleanMessage(activity?.message || "");
                    const taskTitle = activity?.task?.title || "";
                    const projectName = activity?.project?.name || "";
                    const initials = getInitials(actorName);
                    const href = getActivityHref(activity, workspaceId);

                    const { icon: Icon, className } = getActivityIconMeta(
                      activity?.action || "",
                      activity?.entityType || "",
                      activity?.message || "",
                    );

                    const content = (
                      <div className="group flex items-start gap-4 rounded-2xl px-3 py-4 transition hover:bg-slate-100 dark:hover:bg-slate-900/45">
                        <div className="relative shrink-0">
                          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-[var(--app-surface-2)] text-sm font-semibold text-[var(--app-text)] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            {initials}
                          </div>

                          <div
                            className={`absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full ${className}`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-sm leading-6 text-[var(--app-text)]">
                            <span className="font-semibold text-[var(--app-text)]">
                              {actorName}
                            </span>{" "}
                            <span>{message}</span>
                            {projectName ? (
                              <>
                                <span className="text-[var(--app-muted)]">
                                  {" "}
                                  in{" "}
                                </span>
                                <span className="font-medium text-[var(--app-muted)]">
                                  {projectName}
                                </span>
                              </>
                            ) : null}
                          </p>

                          {taskTitle ? (
                            <p className="mt-1 text-sm">
                              <span className="font-medium text-[var(--app-muted)] transition-colors group-hover:text-[var(--app-text)]">
                                {taskTitle}
                              </span>
                            </p>
                          ) : null}

                          <p className="mt-1.5 text-xs text-[var(--app-muted)]">
                            {formatRelativeTime(activity.createdAt)}
                          </p>
                        </div>
                      </div>
                    );

                    if (href) {
                      return (
                        <Link
                          key={activity._id || index}
                          href={href}
                          className="block"
                        >
                          {content}
                        </Link>
                      );
                    }

                    return <div key={activity._id || index}>{content}</div>;
                  })}
                </div>
              </div>
            ))}
          </div>

          {hasMore ? (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + 12)}
                className="rounded-2xl border border-slate-200 bg-[var(--app-surface-2)] px-5 py-3 text-sm font-medium text-[var(--app-text)] transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/70 dark:hover:bg-slate-800"
              >
                Load more
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
