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
      <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-zinc-950 p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">
              Create Project
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Add a new project to this workspace.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-800 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-slate-900 hover:text-white"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleCreateProject} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              Project Name
            </label>
            <input
              type="text"
              placeholder="Enter project name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-800 bg-slate-900/70 px-4 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              Description
            </label>
            <textarea
              placeholder="Write a short project description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              className="h-12 w-full rounded-2xl border border-slate-800 bg-slate-900/70 px-4 text-sm text-white outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            >
              <option value="todo">Todo</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
            <p className="mt-2 text-xs text-slate-500">
              This decides which board column the project appears in.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
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
