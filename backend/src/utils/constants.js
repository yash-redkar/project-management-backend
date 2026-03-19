export const UserRolesEnum = {
    ADMIN: "admin",
    PROJECT_ADMIN: "project_admin",
    MEMBER: "member",
};

export const AvailableUserRole = Object.values(UserRolesEnum);

export const TaskStatusEnum = {
    TODO: "todo",
    IN_PROGRESS: "in_progress",
    DONE: "done",
};

export const AvailableTaskStatus = Object.values(TaskStatusEnum);

export const ProjectStatusEnum = {
    TODO: "todo",
    IN_PROGRESS: "in_progress",
    DONE: "done",
};

export const AvailableProjectStatus = Object.values(ProjectStatusEnum);

export const WorkspaceRolesEnum = {
    OWNER: "owner",
    ADMIN: "admin",
    MEMBER: "member",
    VIEWER: "viewer",
};

export const AvailableWorkspaceRoles = Object.values(WorkspaceRolesEnum);
