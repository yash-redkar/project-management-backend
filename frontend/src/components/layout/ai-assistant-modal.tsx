"use client";

import { useEffect, useMemo, useState } from "react";
import { Sparkles, Send, X, ArrowRight } from "lucide-react";
import { assistantService } from "@/services/assistant.service";
import toast from "react-hot-toast";

type AssistantResult = {
  answer: string;
  suggestions?: string[];
  tasks?: any[];
  projects?: any[];
  members?: any[];
  activity?: any[];
  plan?: string;
};

function isGeneralAssistantQuery(query: string) {
  const normalized = query.toLowerCase();

  return (
    normalized.includes("how to use") ||
    normalized.includes("how this website works") ||
    normalized.includes("step by step") ||
    normalized.includes("new user") ||
    normalized.includes("website guide")
  );
}

export function AiAssistantModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AssistantResult | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const activeWorkspaceId = useMemo(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("teamforge_active_workspace_id") || "";
  }, [isOpen]);

  const handleAsk = async (queryOverride?: string) => {
    const baseQuery = typeof queryOverride === "string" ? queryOverride : query;
    const trimmed = baseQuery.trim();

    if (!trimmed) {
      toast.error("Ask a question about your workspace first");
      return;
    }

    if (typeof queryOverride === "string") {
      setQuery(trimmed);
    }

    const canRunWithoutWorkspace = isGeneralAssistantQuery(trimmed);

    if (!activeWorkspaceId && !canRunWithoutWorkspace) {
      toast.error(
        "Please open or select a workspace first for workspace-specific questions",
      );
      return;
    }

    try {
      setIsLoading(true);
      const res = await assistantService.askAssistant({
        workspaceId: activeWorkspaceId || undefined,
        query: trimmed,
      });

      setResult(res?.data || null);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to load assistant");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-black/70 px-4 pt-20 pb-6 backdrop-blur-sm">
      <div className="my-2 w-full max-w-4xl overflow-hidden rounded-[28px] bg-zinc-950 shadow-2xl shadow-black/50 lg:max-h-[88vh]">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-500 text-white">
              <Sparkles className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">AI Assistant</h2>
              <p className="text-sm text-slate-400">
                Ask about tasks, projects, members, activity, and billing.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 text-slate-400 transition hover:bg-slate-900 hover:text-white"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="grid max-h-[calc(88vh-86px)] gap-5 overflow-y-auto p-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <div className="rounded-[24px] bg-slate-950/70 p-4">
              <label className="mb-2 block text-sm font-medium text-slate-300">
                What do you want to know?
              </label>
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Example: Which tasks are blocked this week? or What plan does my workspace have?"
                className="min-h-[120px] w-full rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-500/40 focus:ring-2 focus:ring-cyan-500/10"
              />

              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    void handleAsk();
                  }}
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 px-4 py-2.5 text-sm font-medium text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isLoading ? "Thinking..." : "Ask Assistant"}
                  <Send className="size-4" />
                </button>
              </div>
            </div>

            <div className="rounded-[24px] bg-slate-950/70 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                Suggested prompts
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  "If you want, I can explain how to use this website one by one.",
                  "What tasks are due soon?",
                  "Show me blocked work.",
                  "Which project needs attention?",
                  "What is my current billing plan?",
                ].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      if (
                        item ===
                        "If you want, I can explain how to use this website one by one."
                      ) {
                        const onboardingPrompt =
                          "Explain how this website works step by step for a new user. Cover workspace setup, team invites, project creation, task management, dashboard tracking, chat, notifications, and billing.";
                        void handleAsk(onboardingPrompt);
                        return;
                      }

                      setQuery(item);
                    }}
                    className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[24px] bg-slate-950/70 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
              Results
            </h3>

            {result ? (
              <div className="mt-3 space-y-4">
                <div className="rounded-2xl bg-slate-900/70 p-4">
                  <p className="text-sm leading-6 text-slate-200">
                    {result.answer}
                  </p>
                </div>

                {result.suggestions?.length ? (
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                      Next steps
                    </p>
                    <div className="space-y-2">
                      {result.suggestions.map((item) => (
                        <div
                          key={item}
                          className="flex items-center gap-2 rounded-2xl bg-slate-900/70 px-3 py-2 text-sm text-slate-300"
                        >
                          <ArrowRight className="size-4 text-cyan-400" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="grid gap-3">
                  {result.tasks?.slice(0, 3).length ? (
                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                        Tasks
                      </p>
                      <div className="space-y-2">
                        {result.tasks.slice(0, 3).map((task) => (
                          <div
                            key={task._id}
                            className="rounded-2xl bg-slate-900/70 px-3 py-3"
                          >
                            <p className="text-sm font-medium text-white">
                              {task.title}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              {task.status || "todo"}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {result.projects?.slice(0, 3).length ? (
                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                        Projects
                      </p>
                      <div className="space-y-2">
                        {result.projects.slice(0, 3).map((project) => (
                          <div
                            key={project._id}
                            className="rounded-2xl bg-slate-900/70 px-3 py-3"
                          >
                            <p className="text-sm font-medium text-white">
                              {project.name}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              {project.status || "todo"}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="mt-3 rounded-2xl border border-dashed border-slate-800 bg-slate-900/50 p-6 text-sm text-slate-400">
                Ask a workspace question to get a summary of matching tasks,
                projects, activity, and billing context.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
