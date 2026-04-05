"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  Plus,
  Search,
  CheckCircle2,
  Clock3,
  CircleDashed,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  Check,
  FolderKanban,
  User,
  CalendarDays,
} from "lucide-react";
import { workspaceService } from "@/services/workspace.service";
import { projectService } from "@/services/project.service";
import { taskService } from "@/services/task.service";
import { CreateTaskModal } from "@/components/task/create-task-modal";

type TaskStatus = "todo" | "in_progress" | "done";

type CombinedTask = {
  _id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  createdAt?: string;
  assignedTo?: any;
  attachments?: any[];
  projectId: string;
  projectName: string;
  projectRole: string;
  subtasksCompleted: number;
  subtasksTotal: number;
};

export default function TasksPage() {
  const [workspaceId, setWorkspaceId] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<CombinedTask[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | TaskStatus>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingTask, setIsUpdatingTask] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([
    "in_progress",
    "todo",
    "done",
  ]);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);

  useEffect(() => {
    const savedWorkspaceId =
      localStorage.getItem("teamforge_active_workspace_id") || "";
    setWorkspaceId(savedWorkspaceId);
  }, []);

  const normalizeStatus = (value?: string): TaskStatus => {
    const normalized = (value || "").toLowerCase().trim();
    if (normalized === "done") return "done";
    if (normalized === "in_progress" || normalized === "in progress") {
      return "in_progress";
    }
    return "todo";
  };

  const getReadableStatus = (status: TaskStatus) => {
    if (status === "in_progress") return "In Progress";
    if (status === "done") return "Done";
    return "Todo";
  };

  const formatDate = (value?: string) => {
    if (!value) return "N/A";
    return new Date(value).toLocaleDateString();
  };

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups((prev) =>
      prev.includes(groupKey)
        ? prev.filter((item) => item !== groupKey)
        : [...prev, groupKey],
    );
  };

  const fetchAllTasks = async () => {
    if (!workspaceId) return;

    try {
      setIsLoading(true);

      const [workspaceRes, projectsRes] = await Promise.all([
        workspaceService.getWorkspaces(),
        projectService.getProjectsByWorkspace(workspaceId),
      ]);

      const allWorkspaces = Array.isArray(workspaceRes?.data)
        ? workspaceRes.data
        : [];

      const currentWorkspace = allWorkspaces.find((item: any) => {
        const workspace = item?.workspace || item;
        return String(workspace?._id) === String(workspaceId);
      });

      const projectItems = Array.isArray(projectsRes?.data)
        ? projectsRes.data
        : Array.isArray(projectsRes)
          ? projectsRes
          : [];

      setWorkspaceName(
        currentWorkspace?.workspace?.name || currentWorkspace?.name || "",
      );
      setProjects(projectItems);

      const taskGroups = await Promise.all(
        projectItems.map(async (projectItem: any) => {
          const project = projectItem?.project || projectItem;
          const projectId = project?._id;
          const projectName = project?.name || "Untitled Project";
          const projectRole = projectItem?.role || "member";

          const tasksRes = await taskService.getTasks(workspaceId, projectId);
          const taskItems = Array.isArray(tasksRes?.data?.items)
            ? tasksRes.data.items
            : [];

          const tasksWithSubtasks = await Promise.all(
            taskItems.map(async (task: any) => {
              try {
                const subtaskRes = await taskService.getSubTasks(
                  workspaceId,
                  projectId,
                  task._id,
                );

                const subtasks = Array.isArray(subtaskRes?.data)
                  ? subtaskRes.data
                  : [];

                const subtasksCompleted = subtasks.filter(
                  (subtask: any) => subtask?.isCompleted,
                ).length;

                return {
                  ...task,
                  status: normalizeStatus(task?.status),
                  projectId,
                  projectName,
                  projectRole,
                  subtasksCompleted,
                  subtasksTotal: subtasks.length,
                };
              } catch {
                return {
                  ...task,
                  status: normalizeStatus(task?.status),
                  projectId,
                  projectName,
                  projectRole,
                  subtasksCompleted: 0,
                  subtasksTotal: 0,
                };
              }
            }),
          );

          return tasksWithSubtasks;
        }),
      );

      setTasks(taskGroups.flat());
    } catch (error) {
      console.error(error);
      toast.error("Failed to load tasks");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (workspaceId) {
      fetchAllTasks();
    }
  }, [workspaceId]);

  const filteredTasks = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesSearch =
        !term ||
        task.title?.toLowerCase().includes(term) ||
        task.description?.toLowerCase().includes(term) ||
        task.projectName?.toLowerCase().includes(term);

      const matchesProject =
        projectFilter === "all" ? true : task.projectId === projectFilter;

      const matchesStatus =
        statusFilter === "all" ? true : task.status === statusFilter;

      return matchesSearch && matchesProject && matchesStatus;
    });
  }, [tasks, searchTerm, projectFilter, statusFilter]);

  const groupedTasks = useMemo(() => {
    return {
      todo: filteredTasks.filter((task) => task.status === "todo"),
      in_progress: filteredTasks.filter(
        (task) => task.status === "in_progress",
      ),
      done: filteredTasks.filter((task) => task.status === "done"),
    };
  }, [filteredTasks]);

  const totalCount = tasks.length;
  const todoCount = tasks.filter((task) => task.status === "todo").length;
  const inProgressCount = tasks.filter(
    (task) => task.status === "in_progress",
  ).length;
  const doneCount = tasks.filter((task) => task.status === "done").length;

  const selectedProject =
    projectFilter === "all"
      ? projects[0]?.project || projects[0] || null
      : projects.find((item: any) => {
          const project = item?.project || item;
          return String(project?._id) === String(projectFilter);
        })?.project ||
        projects.find((item: any) => {
          const project = item?.project || item;
          return String(project?._id) === String(projectFilter);
        }) ||
        null;

  const handleToggleTaskStatus = async (task: CombinedTask) => {
    try {
      setIsUpdatingTask(true);

      const nextStatus = task.status === "done" ? "todo" : "done";

      await taskService.updateTask(workspaceId, task.projectId, task._id, {
        status: nextStatus,
      });

      toast.success(
        nextStatus === "done" ? "Task marked as done" : "Task moved to todo",
      );

      await fetchAllTasks();
    } catch (error: any) {
      console.error(error);
      toast.error(
        error?.response?.data?.message || "Failed to update task status",
      );
    } finally {
      setIsUpdatingTask(false);
    }
  };

  const handleTaskStatusChange = async (
    task: CombinedTask,
    nextStatus: TaskStatus,
  ) => {
    try {
      setIsUpdatingTask(true);

      await taskService.updateTask(workspaceId, task.projectId, task._id, {
        status: nextStatus,
      });

      toast.success("Task status updated");
      await fetchAllTasks();
    } catch (error: any) {
      console.error(error);
      toast.error(
        error?.response?.data?.message || "Failed to update task status",
      );
    } finally {
      setIsUpdatingTask(false);
    }
  };

  if (!workspaceId) {
    return (
      <div className="space-y-4 text-white">
        <h1 className="text-3xl font-semibold">Tasks</h1>
        <p className="text-slate-400">
          Select a workspace first to view tasks.
        </p>
        <Link
          href="/workspaces"
          className="inline-flex rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-800"
        >
          Go to Workspaces
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-5 text-white">
        <div className="rounded-2xl border border-slate-800 bg-linear-to-br from-slate-900 via-slate-950 to-slate-900 p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Tasks
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-400 sm:text-base">
                Manage and track all tasks inside{" "}
                <span className="font-medium text-slate-200">
                  {workspaceName || "this workspace"}
                </span>
                .
              </p>
            </div>

            <button
              onClick={() => {
                if (projects.length === 0) {
                  toast.error("No project available to create a task");
                  return;
                }

                if (projectFilter === "all") {
                  const firstProject = projects[0]?.project || projects[0];
                  if (firstProject?._id) {
                    setProjectFilter(String(firstProject._id));
                  }
                }

                setIsCreateTaskModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-cyan-400"
            >
              <Plus className="h-4 w-4" />
              New Task
            </button>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/70 px-3.5 py-2">
              <CheckCircle2 className="h-4 w-4 text-slate-400" />
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-semibold text-white">
                  {totalCount}
                </span>
                <span className="text-sm text-slate-400">Total</span>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/70 px-3.5 py-2">
              <CircleDashed className="h-4 w-4 text-slate-400" />
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-semibold text-white">
                  {todoCount}
                </span>
                <span className="text-sm text-slate-400">Todo</span>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/70 px-3.5 py-2">
              <Clock3 className="h-4 w-4 text-cyan-400" />
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-semibold text-white">
                  {inProgressCount}
                </span>
                <span className="text-sm text-slate-400">In Progress</span>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/70 px-3.5 py-2">
              <CheckCheck className="h-4 w-4 text-emerald-400" />
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-semibold text-white">
                  {doneCount}
                </span>
                <span className="text-sm text-slate-400">Done</span>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 py-3 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-500/40"
              />
            </div>

            <div className="relative">
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="h-11 appearance-none rounded-2xl border border-slate-800 bg-slate-950/80 px-4 pr-10 text-sm text-white outline-none"
              >
                <option value="all">All Projects</option>
                {projects.map((item: any) => {
                  const project = item?.project || item;
                  return (
                    <option key={project?._id} value={project?._id}>
                      {project?.name}
                    </option>
                  );
                })}
              </select>
              <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
                ▾
              </div>
            </div>

            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as "all" | TaskStatus)
                }
                className="h-11 appearance-none rounded-2xl border border-slate-800 bg-slate-950/80 px-4 pr-10 text-sm text-white outline-none"
              >
                <option value="all">All Status</option>
                <option value="todo">Todo</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
              <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
                ▾
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((group) => (
              <div
                key={group}
                className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4"
              >
                <div className="h-5 w-24 animate-pulse rounded bg-slate-800" />
                <div className="mt-4 space-y-3">
                  {[1, 2].map((item) => (
                    <div
                      key={item}
                      className="h-24 animate-pulse rounded-2xl bg-slate-800/70"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-10 text-center">
            <h2 className="text-xl font-semibold text-white">
              No matching tasks found
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              Try another search or change the project/status filter.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {[
              {
                key: "in_progress",
                title: "In Progress",
                tone: "border-cyan-500/20 bg-cyan-500/10 text-cyan-300",
                items: groupedTasks.in_progress,
              },
              {
                key: "todo",
                title: "Todo",
                tone: "border-slate-700 bg-slate-800 text-slate-300",
                items: groupedTasks.todo,
              },
              {
                key: "done",
                title: "Done",
                tone: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
                items: groupedTasks.done,
              },
            ].map((group) => (
              <div
                key={group.key}
                className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/70"
              >
                <button
                  onClick={() => toggleGroup(group.key)}
                  className="flex w-full items-center justify-between px-4 py-3.5 transition hover:bg-slate-900/60"
                >
                  <div className="flex items-center gap-3">
                    {expandedGroups.includes(group.key) ? (
                      <ChevronDown className="h-4 w-4 text-slate-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-slate-500" />
                    )}

                    <span className="font-semibold text-white">
                      {group.title}
                    </span>

                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-medium ${group.tone}`}
                    >
                      {group.items.length}
                    </span>
                  </div>
                </button>

                {expandedGroups.includes(group.key) ? (
                  <div className="divide-y divide-slate-800">
                    {group.items.map((task) => {
                      const progress =
                        task.subtasksTotal > 0
                          ? Math.round(
                              (task.subtasksCompleted / task.subtasksTotal) *
                                100,
                            )
                          : 0;

                      return (
                        <div
                          key={task._id}
                          className="group flex items-start justify-between gap-4 px-4 py-3.5 transition-all duration-200 hover:bg-slate-900/55"
                        >
                          <div className="flex min-w-0 flex-1 items-start gap-4">
                            <button
                              type="button"
                              onClick={() => handleToggleTaskStatus(task)}
                              disabled={isUpdatingTask}
                              className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
                                task.status === "done"
                                  ? "border-emerald-500 bg-emerald-500/15"
                                  : "border-slate-700 hover:border-cyan-500/40 hover:bg-slate-900"
                              } disabled:cursor-not-allowed disabled:opacity-60`}
                            >
                              {task.status === "done" ? (
                                <Check className="h-3 w-3 text-emerald-400" />
                              ) : null}
                            </button>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0">
                                  <h3 className="truncate text-base font-semibold text-white transition group-hover:text-cyan-300">
                                    {task.title}
                                  </h3>

                                  {task.description ? (
                                    <p className="mt-1 text-sm text-slate-400">
                                      {task.description}
                                    </p>
                                  ) : null}
                                </div>

                                <div className="relative shrink-0">
                                  <select
                                    value={task.status}
                                    onChange={(e) =>
                                      handleTaskStatusChange(
                                        task,
                                        e.target.value as TaskStatus,
                                      )
                                    }
                                    disabled={isUpdatingTask}
                                    className="h-8 appearance-none rounded-full border border-slate-700 bg-slate-900 px-3 pr-9 text-xs font-medium text-slate-300 outline-none transition hover:border-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    <option value="todo">Todo</option>
                                    <option value="in_progress">
                                      In Progress
                                    </option>
                                    <option value="done">Done</option>
                                  </select>
                                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
                                    ▾
                                  </div>
                                </div>
                              </div>

                              {task.subtasksTotal > 0 ? (
                                <div className="mt-3 max-w-md">
                                  <div className="mb-1.5 flex items-center justify-between text-xs text-slate-500">
                                    <span>Subtasks</span>
                                    <span>
                                      {task.subtasksCompleted}/
                                      {task.subtasksTotal}
                                    </span>
                                  </div>
                                  <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                                    <div
                                      className="h-full rounded-full bg-cyan-400 transition-all"
                                      style={{ width: `${progress}%` }}
                                    />
                                  </div>
                                </div>
                              ) : null}

                              <div className="mt-3 flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-300">
                                  <FolderKanban className="h-3.5 w-3.5" />
                                  {task.projectName}
                                </span>

                                <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-300">
                                  <CalendarDays className="h-3.5 w-3.5" />
                                  {formatDate(task.createdAt)}
                                </span>

                                <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-300">
                                  <CircleDashed className="h-3.5 w-3.5" />
                                  {getReadableStatus(task.status)}
                                </span>

                                {task.assignedTo ? (
                                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-300">
                                    <User className="h-3.5 w-3.5" />
                                    {task.assignedTo?.fullName ||
                                      task.assignedTo?.username ||
                                      task.assignedTo?.email ||
                                      "Assigned"}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-500">
                                    <User className="h-3.5 w-3.5" />
                                    Unassigned
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <Link
                            href={`/tasks/${task._id}?workspaceId=${workspaceId}&projectId=${task.projectId}`}
                            className="shrink-0 rounded-xl border border-slate-700 px-3.5 py-1.5 text-sm text-slate-200 transition hover:border-cyan-500/40 hover:bg-slate-900 hover:text-white"
                          >
                            Open
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedProject && (
        <CreateTaskModal
          workspaceId={workspaceId}
          projectId={(selectedProject?.project || selectedProject)?._id || ""}
          isOpen={isCreateTaskModalOpen}
          onClose={() => setIsCreateTaskModalOpen(false)}
          onCreated={async () => {
            await fetchAllTasks();
          }}
        />
      )}
    </>
  );
}
