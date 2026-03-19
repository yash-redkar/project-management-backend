import { apiClient } from "@/lib/api/client";

export const workspaceService = {
  async getWorkspaces() {
    const res = await apiClient.get("/workspaces");
    return res.data;
  },

  async createWorkspace(payload: { name: string; slug: string }) {
    const res = await apiClient.post("/workspaces", payload);
    return res.data;
  },

  async getWorkspaceMembers(workspaceId: string) {
    const res = await apiClient.get(`/workspaces/${workspaceId}/members`);
    return res.data;
  },

  async addWorkspaceMember(
    workspaceId: string,
    payload: {
      email?: string;
      userId?: string;
      role: string;
    },
  ) {
    const res = await apiClient.post(
      `/workspaces/${workspaceId}/members`,
      payload,
    );
    return res.data;
  },

  async updateWorkspaceMemberRole(
    workspaceId: string,
    userId: string,
    payload: { role: string },
  ) {
    const res = await apiClient.put(
      `/workspaces/${workspaceId}/members/${userId}`,
      payload,
    );
    return res.data;
  },

  async removeWorkspaceMember(workspaceId: string, userId: string) {
    const res = await apiClient.delete(
      `/workspaces/${workspaceId}/members/${userId}`,
    );
    return res.data;
  },

  async leaveWorkspace(workspaceId: string) {
    const res = await apiClient.post(`/workspaces/${workspaceId}/leave`);
    return res.data;
  },

  async inviteToWorkspace(
    workspaceId: string,
    payload: {
      email: string;
      role: string;
    },
  ) {
    const res = await apiClient.post(
      `/workspaces/${workspaceId}/invite`,
      payload,
    );
    return res.data;
  },

  async getWorkspacePendingInvites(workspaceId: string) {
    const res = await apiClient.get(`/workspaces/${workspaceId}/invites`);
    return res.data;
  },

  async resendWorkspaceInvite(workspaceId: string, memberId: string) {
    const res = await apiClient.post(
      `/workspaces/${workspaceId}/invites/${memberId}/resend`,
    );
    return res.data;
  },

  async cancelWorkspaceInvite(workspaceId: string, memberId: string) {
    const res = await apiClient.delete(
      `/workspaces/${workspaceId}/invites/${memberId}`,
    );
    return res.data;
  },

  async cleanupExpiredWorkspaceInvites(workspaceId: string) {
    const res = await apiClient.delete(
      `/workspaces/${workspaceId}/invites/expired`,
    );
    return res.data;
  },

  async getWorkspaceBillingSummary(workspaceId: string) {
    const res = await apiClient.get(
      `/workspaces/${workspaceId}/billing-summary`,
    );
    return res.data;
  },
};
