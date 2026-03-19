"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { workspaceService } from "@/services/workspace.service";

export function InviteWorkspaceMemberModal({
  workspaceId,
  isOpen,
  onClose,
  onInvited,
}: {
  workspaceId: string;
  isOpen: boolean;
  onClose: () => void;
  onInvited: () => Promise<void> | void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setEmail("");
      setRole("member");
      setIsLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInvite = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isLoading) return;

    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }

    try {
      setIsLoading(true);

      const data = await workspaceService.inviteToWorkspace(workspaceId, {
        email: email.trim(),
        role,
      });

      toast.success(data?.message || "Invite sent successfully");
      await onInvited();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to send invite");
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
              Invite Workspace Member
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Invite a teammate to join this workspace.
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

        <form onSubmit={handleInvite} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              Email
            </label>
            <input
              type="email"
              placeholder="Enter member email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-800 bg-slate-900/70 px-4 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              Role
            </label>

            <div className="relative">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="h-12 w-full appearance-none rounded-2xl border border-slate-800 bg-slate-900/70 px-4 pr-12 text-sm text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
                <option value="owner">Owner</option>
              </select>

              <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
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
              {isLoading ? "Sending..." : "Send Invite"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
