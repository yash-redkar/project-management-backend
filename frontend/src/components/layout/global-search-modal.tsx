"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  FolderKanban,
  CheckSquare,
  Boxes,
  MessageSquare,
  CalendarDays,
  Bell,
  Activity,
  LayoutDashboard,
  Settings,
} from "lucide-react";

const quickItems = [
  {
    title: "Dashboard",
    subtitle: "Go to main overview",
    href: "/dashboard",
    icon: LayoutDashboard,
    keywords: ["dashboard", "home", "overview"],
  },
  {
    title: "Workspaces",
    subtitle: "Manage collaborative spaces",
    href: "/workspaces",
    icon: Boxes,
    keywords: ["workspace", "team", "spaces"],
  },
  {
    title: "Projects",
    subtitle: "Browse active projects",
    href: "/projects",
    icon: FolderKanban,
    keywords: ["projects", "project", "boards"],
  },
  {
    title: "Tasks",
    subtitle: "Open task management",
    href: "/tasks",
    icon: CheckSquare,
    keywords: ["tasks", "task", "todos"],
  },
  {
    title: "Chat",
    subtitle: "Open team communication",
    href: "/chat",
    icon: MessageSquare,
    keywords: ["chat", "messages", "communication"],
  },
  {
    title: "Calendar",
    subtitle: "Check schedules and planning",
    href: "/calendar",
    icon: CalendarDays,
    keywords: ["calendar", "schedule", "events"],
  },
  {
    title: "Activity",
    subtitle: "Review latest updates",
    href: "/activity",
    icon: Activity,
    keywords: ["activity", "logs", "updates"],
  },
  {
    title: "Notifications",
    subtitle: "See alerts and mentions",
    href: "/notifications",
    icon: Bell,
    keywords: ["notifications", "alerts", "mentions"],
  },
  {
    title: "Settings",
    subtitle: "Manage account and preferences",
    href: "/settings",
    icon: Settings,
    keywords: ["settings", "preferences", "account"],
  },
];

export function GlobalSearchModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) return quickItems;

    return quickItems.filter((item) => {
      return (
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.keywords.some((keyword) => keyword.includes(q))
      );
    });
  }, [query]);

  const handleNavigate = (href: string) => {
    onClose();
    setQuery("");
    router.push(href);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/70 px-4 pt-24 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-800 bg-[var(--app-surface)] shadow-2xl">
        <div className="border-b border-slate-800 p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-500" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search pages, tools, and actions..."
              className="h-14 w-full rounded-2xl border border-slate-800 bg-slate-900/70 pl-12 pr-4 text-sm text-white placeholder:text-slate-500 outline-none focus:border-cyan-500/40 focus:ring-2 focus:ring-cyan-500/10"
            />
          </div>
        </div>

        <div className="max-h-[420px] overflow-y-auto p-3">
          <p className="px-3 pb-2 text-xs uppercase tracking-[0.2em] text-slate-500">
            Quick actions
          </p>

          {filteredItems.length === 0 ? (
            <div className="px-3 py-10 text-center">
              <p className="text-sm font-medium text-white">No results found</p>
              <p className="mt-1 text-xs text-slate-400">
                Try searching for dashboard, workspaces, tasks, or settings.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredItems.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.href}
                    onClick={() => handleNavigate(item.href)}
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-slate-900"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-300">
                      <Icon className="size-4" />
                    </div>

                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">
                        {item.title}
                      </p>
                      <p className="text-xs text-slate-400">{item.subtitle}</p>
                    </div>

                    <span className="text-xs text-slate-500">↵</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-800 px-4 py-3 text-xs text-slate-500">
          <span>Press Esc to close</span>
          <span>Ctrl + K to open</span>
        </div>
      </div>
    </div>
  );
}
