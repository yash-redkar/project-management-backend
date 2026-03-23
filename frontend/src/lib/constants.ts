import type { ProjectPriority, ProjectStatus, TaskStatus } from "@/types/app";

export const APP_NAME = "TeamForge";

export const PROJECT_STATUSES: ProjectStatus[] = [
  "Planning",
  "In Progress",
  "In Review",
  "Completed",
];

export const PROJECT_PRIORITIES: ProjectPriority[] = [
  "Low",
  "Medium",
  "High",
  "Critical",
];

export const TASK_STATUSES: TaskStatus[] = [
  "To Do",
  "In Progress",
  "Completed",
];
