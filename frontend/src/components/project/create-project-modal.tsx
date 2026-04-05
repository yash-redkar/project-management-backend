"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { projectService } from "@/services/project.service";

type ProjectStatus = "todo" | "in_progress" | "done";

export function CreateProjectModal({
  workspaceId,
  isOpen,
  onClose,
  onCreated,
}: {
  workspaceId: string;
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => Promise<void> | void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("todo");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setName("");
      setDescription("");
      setStatus("todo");
      setIsLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreateProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isLoading) return;

    if (!name.trim()) {
      toast.error("Project name is required");
      return;
    }

    try {
      setIsLoading(true);

      const data = await projectService.createProject(workspaceId, {
        name: name.trim(),
        description: description.trim(),
        status,
      });

      toast.success(data?.message || "Project created successfully");
      await onCreated();
      onClose();
    } catch (err: any) {
      console.error("Create project error:", err);
      toast.error(err?.response?.data?.message || "Failed to create project");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-[var(--app-surface)] p-6 shadow-2xl dark:border-slate-800 dark:bg-zinc-950">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-[var(--app-text)]">
              Create Project
            </h2>
            <p className="mt-1 text-sm text-[var(--app-muted)]">
              Add a new project to this workspace.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm text-[var(--app-text)] transition hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleCreateProject} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--app-text)]">
              Project Name
            </label>
            <input
              type="text"
              placeholder="Enter project name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-[var(--app-surface-2)] px-4 text-sm text-[var(--app-text)] placeholder:text-[var(--app-muted)] outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-800 dark:bg-slate-900/70 dark:placeholder:text-slate-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--app-text)]">
              Description
            </label>
            <textarea
              placeholder="Write a short project description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full rounded-2xl border border-slate-200 bg-[var(--app-surface-2)] px-4 py-3 text-sm text-[var(--app-text)] placeholder:text-[var(--app-muted)] outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-800 dark:bg-slate-900/70 dark:placeholder:text-slate-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--app-text)]">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-[var(--app-surface-2)] px-4 text-sm text-[var(--app-text)] outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-800 dark:bg-slate-900/70"
            >
              <option value="todo">Todo</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
            <p className="mt-2 text-xs text-[var(--app-muted)]">
              This decides which board column the project appears in.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-200 bg-[var(--app-surface-2)] px-4 py-3 text-sm font-medium text-[var(--app-text)] transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/70 dark:hover:bg-slate-800"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="rounded-2xl bg-gradient-to-r from-cyan-400 to-indigo-500 px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
