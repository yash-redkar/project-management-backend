import { apiClient } from "@/lib/api/client";

export const projectService = {
  async getProjectsByWorkspace(workspaceId: string) {
    const res = await apiClient.get(`/workspaces/${workspaceId}/projects`);
    return res.data;
  },

  async getProjectById(workspaceId: string, projectId: string) {
    const res = await apiClient.get(
      `/workspaces/${workspaceId}/projects/${projectId}`,
    );
    return res.data;
  },

  async createProject(
    workspaceId: string,
    payload: {
      name: string;
      description?: string;
      status?: "todo" | "in_progress" | "done";
    },
  ) {
    const res = await apiClient.post(
      `/workspaces/${workspaceId}/projects`,
      payload,
    );
    return res.data;
  },

  async updateProject(
    workspaceId: string,
    projectId: string,
    payload: {
      name?: string;
      description?: string;
      status?: "todo" | "in_progress" | "done";
    },
  ) {
    const res = await apiClient.put(
      `/workspaces/${workspaceId}/projects/${projectId}`,
      payload,
    );
    return res.data;
  },

  async deleteProject(workspaceId: string, projectId: string) {
    const res = await apiClient.delete(
      `/workspaces/${workspaceId}/projects/${projectId}`,
    );
    return res.data;
  },

  async getProjectMembers(workspaceId: string, projectId: string) {
    const res = await apiClient.get(
      `/workspaces/${workspaceId}/projects/${projectId}/members`,
    );
    return res.data;
  },

  async updateProjectMemberRole(
    workspaceId: string,
    projectId: string,
    userId: string,
    payload: { role: string },
  ) {
    const res = await apiClient.put(
      `/workspaces/${workspaceId}/projects/${projectId}/members/${userId}`,
      payload,
    );
    return res.data;
  },

  async removeProjectMember(
    workspaceId: string,
    projectId: string,
    userId: string,
  ) {
    const res = await apiClient.delete(
      `/workspaces/${workspaceId}/projects/${projectId}/members/${userId}`,
    );
    return res.data;
  },

  async leaveProject(workspaceId: string, projectId: string) {
    const res = await apiClient.post(
      `/workspaces/${workspaceId}/projects/${projectId}/leave`,
    );
    return res.data;
  },

  async inviteToProject(
    workspaceId: string,
    projectId: string,
    payload: {
      email: string;
      role: string;
    },
  ) {
    const res = await apiClient.post(
      `/workspaces/${workspaceId}/projects/${projectId}/invites`,
      payload,
    );
    return res.data;
  },

  async getPendingProjectInvites(workspaceId: string, projectId: string) {
    const res = await apiClient.get(
      `/workspaces/${workspaceId}/projects/${projectId}/invites`,
    );
    return res.data;
  },

  async resendProjectInvite(
    workspaceId: string,
    projectId: string,
    memberId: string,
  ) {
    const res = await apiClient.post(
      `/workspaces/${workspaceId}/projects/${projectId}/invites/${memberId}/resend`,
    );
    return res.data;
  },

  async cancelProjectInvite(
    workspaceId: string,
    projectId: string,
    memberId: string,
  ) {
    const res = await apiClient.delete(
      `/workspaces/${workspaceId}/projects/${projectId}/invites/${memberId}`,
    );
    return res.data;
  },

  async cleanupExpiredProjectInvites(workspaceId: string, projectId: string) {
    const res = await apiClient.delete(
      `/workspaces/${workspaceId}/projects/${projectId}/invites/expired`,
    );
    return res.data;
  },
};
