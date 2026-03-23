"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import { workspaceService } from "@/services/workspace.service";
import { CreateWorkspaceModal } from "@/components/workspace/create-workspace-modal";

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const loadWorkspaces = async () => {
    try {
      setIsLoading(true);
      setError("");

      const workspaceRes = await workspaceService.getWorkspaces();
      setWorkspaces(workspaceRes.data || []);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || "Failed to load workspaces");
      toast.error(err?.response?.data?.message || "Failed to load workspaces");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspaces();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4 text-white">
        <h1 className="text-3xl font-semibold">Workspaces</h1>
        <p className="text-slate-400">Loading workspaces...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 text-white">
        <h1 className="text-3xl font-semibold">Workspaces</h1>
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 text-white">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Workspaces</h1>
            <p className="mt-2 text-slate-400">
              Manage all your collaborative spaces from one place.
            </p>
          </div>

          <button
            className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-400"
            onClick={() => setIsCreateModalOpen(true)}
          >
            Create Workspace
          </button>
        </div>

        {workspaces.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/50 px-6 py-12 text-center">
            <h2 className="text-lg font-semibold text-white">
              No workspaces found
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Create your first workspace to start organizing projects and
              teams.
            </p>

            <button
              className="mt-5 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-400"
              onClick={() => setIsCreateModalOpen(true)}
            >
              Create Your First Workspace
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {workspaces.map((item: any, index: number) => {
              const workspace = item.workspace || item;
              const role = item.role || "member";
              const status = item.status || "active";

              return (
                <div
                  key={workspace._id || index}
                  className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 transition hover:border-slate-700 hover:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-xl font-semibold text-white">
                        {workspace.name}
                      </h2>
                      <p className="mt-1 text-sm text-slate-400">
                        Slug: {workspace.slug}
                      </p>
                    </div>

                    <span className="rounded-full border border-slate-700 bg-zinc-950 px-2.5 py-1 text-xs text-slate-300">
                      {workspace.plan || "free"}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-slate-400">
                    <p>
                      <span className="text-slate-500">Role:</span> {role}
                    </p>
                    <p>
                      <span className="text-slate-500">Status:</span> {status}
                    </p>
                    <p>
                      <span className="text-slate-500">Created:</span>{" "}
                      {workspace.createdAt
                        ? new Date(workspace.createdAt).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>

                  <div className="mt-5 flex items-center justify-between">
                    <p className="text-xs text-slate-500">
                      Ready for projects and collaboration
                    </p>

                    <Link
                      href={`/workspaces/${workspace._id}`}
                      onClick={() => {
                        localStorage.setItem(
                          "teamforge_active_workspace_id",
                          workspace._id,
                        );
                      }}
                      className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-800 hover:text-white"
                    >
                      Open
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CreateWorkspaceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={loadWorkspaces}
      />
    </>
  );
}
