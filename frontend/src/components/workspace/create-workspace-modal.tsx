"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { workspaceService } from "@/services/workspace.service";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function CreateWorkspaceModal({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => Promise<void> | void;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const generatedSlug = useMemo(() => slugify(name), [name]);

  useEffect(() => {
    if (!slug) {
      setSlug(generatedSlug);
    }
  }, [generatedSlug, slug]);

  useEffect(() => {
    if (!isOpen) {
      setName("");
      setSlug("");
      setIsLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreateWorkspace = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isLoading) return;

    if (!name.trim()) {
      toast.error("Workspace name is required");
      return;
    }

    const finalSlug = slugify(slug || name);

    if (!finalSlug) {
      toast.error("Valid workspace slug is required");
      return;
    }

    try {
      setIsLoading(true);

      const data = await workspaceService.createWorkspace({
        name: name.trim(),
        slug: finalSlug,
      });

      console.log("Workspace created:", data);
      toast.success(data?.message || "Workspace created successfully");

      await onCreated();
      onClose();
    } catch (err: any) {
      console.error("Create workspace error:", err);
      toast.error(err?.response?.data?.message || "Failed to create workspace");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-zinc-950 p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">
              Create Workspace
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Start a new collaborative space for your team.
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

        <form onSubmit={handleCreateWorkspace} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              Workspace Name
            </label>
            <input
              type="text"
              placeholder="Enter workspace name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slug || slug === generatedSlug) {
                  setSlug(slugify(e.target.value));
                }
              }}
              className="h-12 w-full rounded-2xl border border-slate-800 bg-slate-900/70 px-4 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              Workspace Slug
            </label>
            <input
              type="text"
              placeholder="workspace-slug"
              value={slug}
              onChange={(e) => setSlug(slugify(e.target.value))}
              className="h-12 w-full rounded-2xl border border-slate-800 bg-slate-900/70 px-4 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
            <p className="mt-2 text-xs text-slate-500">
              Preview: /workspace/{slug || "your-workspace"}
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
              {isLoading ? "Creating..." : "Create Workspace"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
