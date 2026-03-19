"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock,
  X,
  User,
  FolderKanban,
} from "lucide-react";
import { taskService } from "@/services/task.service";

type CalendarTask = {
  _id: string;
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  dueDate?: string | null;
  project?: {
    _id?: string;
    name?: string;
  };
  assignedTo?: {
    _id?: string;
    username?: string;
    fullName?: string;
    name?: string;
    email?: string;
  } | null;
};

const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getDateKeyFromValue(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return getDateKey(date);
}

function isSameDay(a: Date, b: Date) {
  return getDateKey(a) === getDateKey(b);
}

function formatMonthYear(date: Date) {
  return date.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

function formatFullDate(date: Date) {
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTaskDate(value?: string | null) {
  if (!value) return "No due date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No due date";

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getDateInputValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getCalendarDays(currentMonth: Date) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const firstDayWeekIndex = (firstDayOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: Array<{ date: Date; currentMonth: boolean }> = [];

  for (let i = firstDayWeekIndex; i > 0; i--) {
    cells.push({
      date: new Date(year, month, 1 - i),
      currentMonth: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({
      date: new Date(year, month, day),
      currentMonth: true,
    });
  }

  while (cells.length < 42) {
    const nextDay = cells.length - (firstDayWeekIndex + daysInMonth) + 1;
    cells.push({
      date: new Date(year, month + 1, nextDay),
      currentMonth: false,
    });
  }

  return cells;
}

function normalizeStatus(status?: string) {
  return String(status || "")
    .toLowerCase()
    .replace(/[_\s-]/g, "");
}

function getStatusStyle(status?: string) {
  const normalized = normalizeStatus(status);

  if (normalized === "done") {
    return {
      pill: "border-green-500/20 bg-green-500/10 text-green-300",
      dot: "bg-green-400",
      label: "Done",
    };
  }

  if (normalized === "inprogress") {
    return {
      pill: "border-cyan-500/20 bg-cyan-500/10 text-cyan-300",
      dot: "bg-cyan-400",
      label: "In Progress",
    };
  }

  return {
    pill: "border-slate-700 bg-slate-800 text-slate-300",
    dot: "bg-slate-400",
    label: "Todo",
  };
}

function getPriorityStyle(priority?: string) {
  switch (String(priority || "").toLowerCase()) {
    case "urgent":
      return "border-red-500/20 bg-red-500/10 text-red-300";
    case "high":
      return "border-orange-500/20 bg-orange-500/10 text-orange-300";
    case "medium":
      return "border-blue-500/20 bg-blue-500/10 text-blue-300";
    case "low":
      return "border-slate-700 bg-slate-800 text-slate-300";
    default:
      return "border-slate-700 bg-slate-800 text-slate-300";
  }
}

function getPriorityDot(priority?: string) {
  switch (String(priority || "").toLowerCase()) {
    case "urgent":
      return "bg-red-400";
    case "high":
      return "bg-orange-400";
    case "medium":
      return "bg-blue-400";
    case "low":
      return "bg-slate-400";
    default:
      return "bg-slate-400";
  }
}

function getAssigneeName(task: CalendarTask) {
  return (
    task.assignedTo?.fullName ||
    task.assignedTo?.name ||
    task.assignedTo?.username ||
    task.assignedTo?.email ||
    "Unassigned"
  );
}

export default function WorkspaceCalendarPage() {
  const params = useParams();

  const workspaceId =
    typeof params.workspaceId === "string"
      ? params.workspaceId
      : Array.isArray(params.workspaceId)
        ? params.workspaceId[0]
        : "";

  const today = useMemo(() => new Date(), []);
  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState(today);
  const [drawerDate, setDrawerDate] = useState<Date | null>(null);
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverDateKey, setDragOverDateKey] = useState<string | null>(null);
  const [isRescheduling, setIsRescheduling] = useState(false);

  useEffect(() => {
    const loadTasks = async () => {
      if (!workspaceId) return;

      try {
        setIsLoading(true);

        const res = await taskService.getWorkspaceTasks(workspaceId, {
          limit: 500,
        });

        const items = Array.isArray(res?.data?.items) ? res.data.items : [];
        const onlyTasksWithDueDate = items.filter(
          (item: CalendarTask) => !!item?.dueDate,
        );

        setTasks(onlyTasksWithDueDate);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load calendar tasks");
      } finally {
        setIsLoading(false);
      }
    };

    loadTasks();
  }, [workspaceId]);

  useEffect(() => {
    if (!drawerDate) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDrawerDate(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [drawerDate]);

  const tasksByDate = useMemo(() => {
    const grouped: Record<string, CalendarTask[]> = {};

    for (const task of tasks) {
      const key = getDateKeyFromValue(task.dueDate);
      if (!key) continue;

      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(task);
    }

    Object.keys(grouped).forEach((key) => {
      grouped[key].sort((a, b) => {
        const aDone = normalizeStatus(a.status) === "done" ? 1 : 0;
        const bDone = normalizeStatus(b.status) === "done" ? 1 : 0;

        if (aDone !== bDone) return aDone - bDone;

        const aDate = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        const bDate = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        return aDate - bDate;
      });
    });

    return grouped;
  }, [tasks]);

  const calendarDays = useMemo(
    () => getCalendarDays(currentMonth),
    [currentMonth],
  );

  const selectedDateKey = getDateKey(selectedDate);
  const selectedDayTasks = tasksByDate[selectedDateKey] || [];

  const drawerDateKey = drawerDate ? getDateKey(drawerDate) : "";
  const drawerTasks = drawerDate ? tasksByDate[drawerDateKey] || [] : [];

  const currentMonthTaskCount = useMemo(() => {
    return tasks.filter((task) => {
      if (!task.dueDate) return false;
      const date = new Date(task.dueDate);
      return (
        date.getFullYear() === currentMonth.getFullYear() &&
        date.getMonth() === currentMonth.getMonth()
      );
    }).length;
  }, [tasks, currentMonth]);

  const upcomingTasks = useMemo(() => {
    const nowKey = getDateKey(today);

    return tasks
      .filter((task) => {
        const key = getDateKeyFromValue(task.dueDate);
        return key >= nowKey && normalizeStatus(task.status) !== "done";
      })
      .sort((a, b) => {
        const aDate = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        const bDate = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        return aDate - bDate;
      })
      .slice(0, 5);
  }, [tasks, today]);

  const handleDragStart = (e: React.DragEvent<HTMLElement>, taskId: string) => {
    e.dataTransfer.setData("text/plain", taskId);
    e.dataTransfer.effectAllowed = "move";
    setDraggingTaskId(taskId);
  };

  const handleDragEnd = () => {
    setDraggingTaskId(null);
    setDragOverDateKey(null);
  };

  const handleDragOverDate = (
    e: React.DragEvent<HTMLElement>,
    dateKey: string,
  ) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverDateKey(dateKey);
  };

  const handleDropOnDate = async (
    e: React.DragEvent<HTMLElement>,
    targetDate: Date,
  ) => {
    e.preventDefault();

    const taskId = e.dataTransfer.getData("text/plain") || draggingTaskId;
    setDragOverDateKey(null);
    setDraggingTaskId(null);

    if (!taskId) return;

    const taskToMove = tasks.find((task) => task._id === taskId);
    if (!taskToMove) return;

    const oldDateKey = getDateKeyFromValue(taskToMove.dueDate);
    const newDateValue = getDateInputValue(targetDate);
    const newDateKey = getDateKey(targetDate);

    if (oldDateKey === newDateKey) return;

    if (!taskToMove.project?._id) {
      toast.error("Project information missing for this task");
      return;
    }

    const previousTasks = tasks;

    setTasks((prev) =>
      prev.map((task) =>
        task._id === taskId ? { ...task, dueDate: newDateValue } : task,
      ),
    );

    try {
      setIsRescheduling(true);

      await taskService.updateTask(
        workspaceId,
        taskToMove.project._id,
        taskToMove._id,
        {
          dueDate: newDateValue,
        },
      );

      toast.success(`Task moved to ${formatFullDate(targetDate)}`);

      if (drawerDate && oldDateKey === drawerDateKey) {
        setDrawerDate(new Date(targetDate));
      }
      if (selectedDateKey === oldDateKey) {
        setSelectedDate(targetDate);
      }
    } catch (err: any) {
      console.error(err);
      setTasks(previousTasks);
      console.error("Drag update error:", err?.response?.data || err);

      toast.error(
        err?.response?.data?.errors?.[0]?.msg ||
          err?.response?.data?.message ||
          "Failed to reschedule task",
      );
    } finally {
      setIsRescheduling(false);
    }
  };

  const renderTaskLinkCard = (task: CalendarTask, keyPrefix = "") => {
    const statusStyle = getStatusStyle(task.status);

    return (
      <Link
        key={`${keyPrefix}${task._id}`}
        href={`/tasks/${task._id}?workspaceId=${workspaceId}&projectId=${task.project?._id || ""}`}
        draggable
        onDragStart={(e) => handleDragStart(e, task._id)}
        onDragEnd={handleDragEnd}
        className={`block rounded-2xl border border-slate-800 bg-slate-950/60 p-4 transition hover:border-slate-700 ${
          draggingTaskId === task._id ? "opacity-60" : ""
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {task.title || "Untitled Task"}
            </p>

            <p className="mt-2 truncate text-xs text-slate-400">
              {task.project?.name || "Unknown Project"}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full border px-2.5 py-1 text-[11px] ${statusStyle.pill}`}
              >
                {statusStyle.label}
              </span>

              <span
                className={`rounded-full border px-2.5 py-1 text-[11px] capitalize ${getPriorityStyle(task.priority)}`}
              >
                {task.priority || "medium"}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-3.5" />
                {formatTaskDate(task.dueDate)}
              </span>
              <span>Assignee: {getAssigneeName(task)}</span>
            </div>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <>
      <div className="space-y-6 text-white">
        <div className="flex flex-col gap-4 border-b border-slate-800 pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-white">Calendar</h1>
            <p className="mt-2 text-sm text-slate-400">
              Track task due dates across your workspace.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isRescheduling ? (
              <span className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs font-medium text-cyan-300">
                Updating due date...
              </span>
            ) : null}

            <Link
              href={`/workspaces/${workspaceId}`}
              className="inline-flex items-center rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-800"
            >
              Back
            </Link>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_360px]">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-white">
                  {formatMonthYear(currentMonth)}
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  {currentMonthTaskCount} task
                  {currentMonthTaskCount === 1 ? "" : "s"} due this month
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setCurrentMonth(
                      new Date(
                        currentMonth.getFullYear(),
                        currentMonth.getMonth() - 1,
                        1,
                      ),
                    )
                  }
                  className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-300 transition hover:bg-slate-800"
                >
                  <ChevronLeft className="size-4" />
                </button>

                <button
                  onClick={() => {
                    const now = new Date();
                    setCurrentMonth(
                      new Date(now.getFullYear(), now.getMonth(), 1),
                    );
                    setSelectedDate(now);
                  }}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-800"
                >
                  Today
                </button>

                <button
                  onClick={() =>
                    setCurrentMonth(
                      new Date(
                        currentMonth.getFullYear(),
                        currentMonth.getMonth() + 1,
                        1,
                      ),
                    )
                  }
                  className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-300 transition hover:bg-slate-800"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>

            <div className="mb-4 grid grid-cols-7 gap-3">
              {WEEK_DAYS.map((day) => (
                <div
                  key={day}
                  className="px-2 py-2 text-center text-sm font-medium text-slate-500"
                >
                  {day}
                </div>
              ))}
            </div>

            {isLoading ? (
              <div className="rounded-2xl border border-dashed border-slate-700 p-10 text-center text-slate-400">
                Loading calendar...
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-3">
                {calendarDays.map((cell, index) => {
                  const dateKey = getDateKey(cell.date);
                  const dayTasks = tasksByDate[dateKey] || [];
                  const isSelected = isSameDay(cell.date, selectedDate);
                  const isTodayCell = isSameDay(cell.date, today);
                  const isDragOver = dragOverDateKey === dateKey;

                  return (
                    <button
                      key={`${dateKey}-${index}`}
                      onClick={() => {
                        setSelectedDate(cell.date);
                        setDrawerDate(cell.date);
                      }}
                      onDragOver={(e) => handleDragOverDate(e, dateKey)}
                      onDragEnter={(e) => handleDragOverDate(e, dateKey)}
                      onDragLeave={() => {
                        if (dragOverDateKey === dateKey) {
                          setDragOverDateKey(null);
                        }
                      }}
                      onDrop={(e) => handleDropOnDate(e, cell.date)}
                      className={`min-h-[130px] rounded-2xl border p-3 text-left transition ${
                        isSelected
                          ? "border-cyan-400/50 bg-cyan-500/10 ring-1 ring-cyan-400/20"
                          : "border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/80"
                      } ${cell.currentMonth ? "" : "opacity-35"} ${
                        isDragOver
                          ? "border-cyan-400 bg-cyan-500/15 ring-2 ring-cyan-400/20"
                          : ""
                      } hover:scale-[1.01]`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-sm font-semibold ${
                            isTodayCell ? "text-cyan-300" : "text-white"
                          }`}
                        >
                          {cell.date.getDate()}
                        </span>

                        {dayTasks.length > 0 ? (
                          <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-[10px] text-slate-300">
                            {dayTasks.length}
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-3 space-y-2">
                        {dayTasks.slice(0, 2).map((task, taskIndex) => {
                          const statusStyle = getStatusStyle(task.status);

                          return (
                            <div
                              key={task._id || `${dateKey}-${taskIndex}`}
                              draggable
                              onDragStart={(e) => handleDragStart(e, task._id)}
                              onDragEnd={handleDragEnd}
                              onClick={(e) => e.stopPropagation()}
                              className={`rounded-xl border border-slate-800 bg-slate-900/80 px-2 py-1.5 ${
                                draggingTaskId === task._id ? "opacity-60" : ""
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className={`h-2 w-2 rounded-full ${getPriorityDot(task.priority)}`}
                                />
                                <p className="truncate text-[11px] font-medium text-slate-200">
                                  {task.title || "Untitled Task"}
                                </p>
                              </div>
                              <div className="mt-1 flex items-center gap-2">
                                <div
                                  className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`}
                                />
                                <p className="text-[10px] text-slate-500">
                                  {statusStyle.label}
                                </p>
                              </div>
                            </div>
                          );
                        })}

                        {dayTasks.length > 2 ? (
                          <p className="pt-1 text-[11px] text-slate-500">
                            +{dayTasks.length - 2} more
                          </p>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div
              className={`rounded-3xl border bg-slate-900/70 p-6 transition ${
                dragOverDateKey === selectedDateKey
                  ? "border-cyan-400 ring-2 ring-cyan-400/20"
                  : "border-slate-800"
              }`}
              onDragOver={(e) => handleDragOverDate(e, selectedDateKey)}
              onDrop={(e) => handleDropOnDate(e, selectedDate)}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold text-white">
                    {isSameDay(selectedDate, today) ? "Today" : "Selected Day"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    {formatFullDate(selectedDate)}
                  </p>
                </div>

                <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300">
                  {selectedDayTasks.length} task
                  {selectedDayTasks.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="mt-6 space-y-3">
                {isLoading ? (
                  <div className="rounded-2xl border border-dashed border-slate-700 p-6 text-sm text-slate-400">
                    Loading tasks...
                  </div>
                ) : selectedDayTasks.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-700 p-6 text-sm text-slate-500">
                    No tasks due on this day.
                  </div>
                ) : (
                  selectedDayTasks.map((task) =>
                    renderTaskLinkCard(task, "selected-"),
                  )
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
              <div className="flex items-center gap-2">
                <CalendarDays className="size-5 text-cyan-300" />
                <h3 className="text-lg font-semibold text-white">Upcoming</h3>
              </div>

              <div className="mt-4 space-y-3">
                {isLoading ? (
                  <p className="text-sm text-slate-400">
                    Loading upcoming tasks...
                  </p>
                ) : upcomingTasks.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-700 p-4 text-sm text-slate-500">
                    No upcoming pending tasks.
                  </div>
                ) : (
                  upcomingTasks.map((task) => {
                    const statusStyle = getStatusStyle(task.status);

                    return (
                      <Link
                        key={`upcoming-${task._id}`}
                        href={`/tasks/${task._id}?workspaceId=${workspaceId}&projectId=${task.project?._id || ""}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task._id)}
                        onDragEnd={handleDragEnd}
                        className={`block rounded-2xl border border-slate-800 bg-slate-950/60 p-4 transition hover:border-slate-700 ${
                          draggingTaskId === task._id ? "opacity-60" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <div
                                className={`h-2 w-2 rounded-full ${getPriorityDot(task.priority)}`}
                              />
                              <p className="truncate text-sm font-medium text-white">
                                {task.title || "Untitled Task"}
                              </p>
                            </div>
                            <p className="mt-1 truncate text-xs text-slate-400">
                              {task.project?.name || "Unknown Project"}
                            </p>
                          </div>

                          <span
                            className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] ${statusStyle.pill}`}
                          >
                            {statusStyle.label}
                          </span>
                        </div>

                        <p className="mt-3 text-xs text-slate-500">
                          Due {formatTaskDate(task.dueDate)}
                        </p>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {drawerDate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setDrawerDate(null);
            }
          }}
        >
          <div
            className={`h-full w-full max-w-xl overflow-y-auto border-l bg-zinc-950/95 p-6 shadow-2xl transition ${
              dragOverDateKey === drawerDateKey
                ? "border-cyan-400 ring-2 ring-cyan-400/20"
                : "border-slate-800"
            }`}
            onDragOver={(e) => handleDragOverDate(e, drawerDateKey)}
            onDrop={(e) => handleDropOnDate(e, drawerDate)}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <h2 className="text-2xl font-semibold text-white">
                  Day Details
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  {formatFullDate(drawerDate)}
                </p>
              </div>

              <button
                onClick={() => setDrawerDate(null)}
                className="rounded-xl border border-slate-700 p-2 text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-slate-400">
                {drawerTasks.length} task{drawerTasks.length === 1 ? "" : "s"}{" "}
                due
              </p>

              <button
                onClick={() => {
                  setSelectedDate(drawerDate);
                  setDrawerDate(null);
                }}
                className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs font-medium text-cyan-300 transition hover:bg-cyan-500/15"
              >
                Set as selected day
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {drawerTasks.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-700 p-6 text-sm text-slate-500">
                  No tasks due on this day.
                </div>
              ) : (
                drawerTasks.map((task) => {
                  const statusStyle = getStatusStyle(task.status);

                  return (
                    <Link
                      key={`drawer-${task._id}`}
                      href={`/tasks/${task._id}?workspaceId=${workspaceId}&projectId=${task.project?._id || ""}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task._id)}
                      onDragEnd={handleDragEnd}
                      className={`block rounded-3xl border border-slate-800 bg-slate-900/70 p-5 transition hover:border-slate-700 hover:bg-slate-900 ${
                        draggingTaskId === task._id ? "opacity-60" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <div
                              className={`h-2.5 w-2.5 rounded-full ${getPriorityDot(task.priority)}`}
                            />
                            <p className="text-base font-semibold text-white">
                              {task.title || "Untitled Task"}
                            </p>
                          </div>

                          {task.description ? (
                            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">
                              {task.description}
                            </p>
                          ) : null}

                          <div className="mt-4 flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full border px-2.5 py-1 text-[11px] ${statusStyle.pill}`}
                            >
                              {statusStyle.label}
                            </span>

                            <span
                              className={`rounded-full border px-2.5 py-1 text-[11px] capitalize ${getPriorityStyle(task.priority)}`}
                            >
                              {task.priority || "medium"}
                            </span>
                          </div>

                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                              <div className="flex items-center gap-2 text-slate-400">
                                <FolderKanban className="size-4" />
                                <span className="text-xs uppercase tracking-[0.12em]">
                                  Project
                                </span>
                              </div>
                              <p className="mt-2 text-sm text-white">
                                {task.project?.name || "Unknown Project"}
                              </p>
                            </div>

                            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                              <div className="flex items-center gap-2 text-slate-400">
                                <User className="size-4" />
                                <span className="text-xs uppercase tracking-[0.12em]">
                                  Assignee
                                </span>
                              </div>
                              <p className="mt-2 text-sm text-white">
                                {getAssigneeName(task)}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                            <Clock className="size-3.5" />
                            <span>Due {formatTaskDate(task.dueDate)}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
