"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { taskService } from "@/services/task.service";
import { projectMemberService } from "@/services/project-member.service";

export function CreateTaskModal({
  workspaceId,
  projectId,
  isOpen,
  onClose,
  onCreated,
  initialDueDate,
}: {
  workspaceId: string;
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => Promise<void> | void;
  initialDueDate?: string;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMembersLoading, setIsMembersLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setTitle("");
      setDescription("");
      setAssignedTo("");
      setPriority("medium");
      setDueDate("");
      setMembers([]);
      setIsLoading(false);
      setIsMembersLoading(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setDueDate(initialDueDate || "");
    }
  }, [isOpen, initialDueDate]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
    }

    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    const loadMembers = async () => {
      if (!isOpen || !workspaceId || !projectId) return;

      try {
        setIsMembersLoading(true);

        const res = await projectMemberService.getProjectMembers(
          workspaceId,
          projectId,
        );

        const rawMembers = Array.isArray(res?.data) ? res.data : [];
        setMembers(rawMembers);
      } catch (err: any) {
        console.error("Failed to load project members:", err);
        toast.error("Failed to load project members");
      } finally {
        setIsMembersLoading(false);
      }
    };

    loadMembers();
  }, [isOpen, workspaceId, projectId]);

  if (!isOpen) return null;

  const handleCreateTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isLoading) return;

    if (!title.trim()) {
      toast.error("Task title is required");
      return;
    }

    if (title.trim().length < 3) {
      toast.error("Task title must be at least 3 characters");
      return;
    }

    try {
      setIsLoading(true);

      const payload: {
        title: string;
        description: string;
        assignedTo?: string;
        priority?: string;
        dueDate?: string | null;
      } = {
        title: title.trim(),
        description: description.trim(),
        priority,
      };

      if (assignedTo) {
        payload.assignedTo = assignedTo;
      }

      if (dueDate) {
        payload.dueDate = dueDate;
      }

      const data = await taskService.createTask(
        workspaceId,
        projectId,
        payload,
      );

      toast.success(data?.message || "Task created successfully");
      await onCreated();
      onClose();
    } catch (err: any) {
      console.error("Create task error:", err);
      toast.error(err?.response?.data?.message || "Failed to create task");
    } finally {
      setIsLoading(false);
    }
  };

  const getMemberUser = (item: any) => item?.user || item;

  const getMemberLabel = (item: any) => {
    const user = getMemberUser(item);
    return (
      user?.fullName ||
      user?.name ||
      user?.username ||
      user?.email ||
      "Unknown Member"
    );
  };

  const getMemberValue = (item: any) => {
    const user = getMemberUser(item);
    return user?._id || user?.id || "";
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-950 to-slate-900 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.7)]">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">Create Task</h2>
            <p className="mt-1 text-sm text-slate-400">
              Add a new task to this project.
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

        <form onSubmit={handleCreateTask} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              Task Title
            </label>

            <input
              type="text"
              placeholder="Enter task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-800 bg-slate-900/60 px-4 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              Description
            </label>

            <textarea
              placeholder="Write a short task description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">
                Priority
              </label>

              <div className="relative">
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="h-12 w-full appearance-none rounded-2xl border border-slate-800 bg-slate-900/70 px-4 pr-10 text-sm text-white outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>

                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                  ▾
                </div>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">
                Due Date
              </label>

              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-800 bg-slate-900/60 px-4 text-sm text-white outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              Assignee
            </label>

            <div className="relative">
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                disabled={isMembersLoading}
                className="h-12 w-full appearance-none rounded-2xl border border-slate-800 bg-slate-900/70 px-4 pr-10 text-sm text-white outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <option value="">Unassigned</option>

                {members.map((member: any, index: number) => (
                  <option
                    key={getMemberValue(member) || index}
                    value={getMemberValue(member)}
                  >
                    {getMemberLabel(member)}
                  </option>
                ))}
              </select>

              <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                ▾
              </div>
            </div>

            <p className="mt-2 text-xs text-slate-500">
              {isMembersLoading
                ? "Loading project members..."
                : members.length === 0
                  ? "No project members found."
                  : "Choose who will own this task."}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-3 text-xs text-slate-400">
            Due date is optional. Only tasks with a due date will appear in the
            calendar view.
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
              className="rounded-2xl bg-gradient-to-r from-cyan-400 to-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.03] hover:shadow-cyan-500/40 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? "Creating..." : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
