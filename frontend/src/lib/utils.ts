import type {
  ProjectPriority,
  ProjectStatus,
  WorkspaceHealth,
} from "@/types/app";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function getPriorityBadgeVariant(priority: ProjectPriority) {
  switch (priority) {
    case "Critical":
      return "danger";
    case "High":
      return "warning";
    case "Medium":
      return "info";
    default:
      return "secondary";
  }
}

export function getStatusBadgeVariant(status: ProjectStatus) {
  switch (status) {
    case "Completed":
      return "success";
    case "In Review":
      return "warning";
    case "In Progress":
      return "info";
    default:
      return "secondary";
  }
}

export function getHealthBadgeVariant(health: WorkspaceHealth) {
  switch (health) {
    case "Blocked":
      return "danger";
    case "Watch":
      return "warning";
    default:
      return "success";
  }
}

export function getStatusAccentClass(status: ProjectStatus) {
  switch (status) {
    case "Planning":
      return "bg-slate-500";
    case "In Progress":
      return "bg-indigo-500";
    case "In Review":
      return "bg-amber-400";
    case "Completed":
      return "bg-emerald-400";
  }
}
