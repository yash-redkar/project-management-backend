export type WorkspaceHealth = "On Track" | "Watch" | "Blocked";
export type ProjectStatus =
  | "Planning"
  | "In Progress"
  | "In Review"
  | "Completed";
export type ProjectPriority = "Low" | "Medium" | "High" | "Critical";
export type TaskStatus = "To Do" | "In Progress" | "Completed";
export type TaskPriority = "Low" | "Medium" | "High" | "Urgent";
export type MemberStatus = "online" | "away" | "offline";

export interface Member {
  id: string;
  name: string;
  initials: string;
  color: string;
  role?: string;
  status?: MemberStatus;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: "sparkles" | "rocket" | "shield" | "briefcase" | "palette" | "layers";
  color: string;
  projectsCount: number;
  membersCount: number;
  updatedAt: string;
  isFavorite?: boolean;
  health: WorkspaceHealth;
  members: Member[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  dueDate: string;
  taskCount: number;
  commentCount: number;
  attachmentCount: number;
  workspaceId: string;
  workspaceName: string;
  progress: number;
  members: Member[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  projectId: string;
  projectName: string;
  completedSubtasks: number;
  totalSubtasks: number;
  commentsCount: number;
  attachmentsCount: number;
  assignee: Member;
}

export type NotificationType =
  | "task-assigned"
  | "mention"
  | "comment"
  | "system-alert"
  | "project-update";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  contextLabel: string;
  time: string;
  read: boolean;
  actor?: Member;
}

export interface ChatMessage {
  id: string;
  sender: Member;
  content: string;
  time: string;
  isOwn?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  avatarLabel: string;
  avatarColor: string;
  latestMessage: string;
  time: string;
  unreadCount: number;
  memberCount: number;
  isOnline?: boolean;
  isTyping?: boolean;
}

export interface ActivityEvent {
  id: string;
  actor: Member;
  action: string;
  target: string;
  context: string;
  time: string;
  kind: "task" | "comment" | "project" | "file" | "member";
}

export interface WeeklyProgressPoint {
  day: string;
  value: number;
  focus: string;
}

export interface DashboardStat {
  id: "workspaces" | "assigned" | "due" | "activity";
  label: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
  hint: string;
}

export interface UserProfile extends Member {
  email: string;
  phone: string;
  bio: string;
  team: string;
  plan: string;
}
