"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { projectService } from "@/services/project.service";

type InviteProjectMemberModalProps = {
  workspaceId: string;
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onInvited?: () => Promise<void> | void;
};

export function InviteProjectMemberModal({
  workspaceId,
  projectId,
  isOpen,
  onClose,
  onInvited,
}: InviteProjectMemberModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    if (isSubmitting) return;
    setEmail("");
    setRole("member");
    onClose();
  };

  const handleInvite = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /\S+@\S+\.\S+/;

    if (!trimmedEmail) {
      toast.error("Email is required");
      return;
    }

    if (!emailRegex.test(trimmedEmail)) {
      toast.error("Please enter a valid email");
      return;
    }

    try {
      setIsSubmitting(true);

      const data = await projectService.inviteToProject(
        workspaceId,
        projectId,
        {
          email: trimmedEmail,
          role,
        },
      );

      toast.success(data?.message || "Project invite sent successfully");

      setEmail("");
      setRole("member");

      await onInvited?.();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(
        err?.response?.data?.message || "Failed to send project invite",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-zinc-950 p-6 text-white shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-white">
              Invite Project Member
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Send an invite to join this project.
            </p>
          </div>

          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Close
          </button>
        </div>

        <div className="mt-8 space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleInvite();
                }
              }}
              placeholder="Enter member email"
              disabled={isSubmitting}
              className="w-full rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-500/60 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={isSubmitting}
              className="w-full rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-4 text-sm text-white outline-none transition focus:border-cyan-500/60 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="member">👤 Member</option>
              <option value="admin">⭐ Admin</option>
            </select>
          </div>

          <button
            onClick={handleInvite}
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-500 px-4 py-3 text-sm font-medium text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Sending Invite..." : "Send Invite"}
          </button>
        </div>
      </div>
    </div>
  );
}
