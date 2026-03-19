import { apiClient } from "@/lib/api/client";

export const activityService = {
  async getWorkspaceActivity(workspaceId: string, limit = 10) {
    const res = await apiClient.get(`/workspaces/${workspaceId}/activity`, {
      params: { limit },
    });
    return res.data;
  },

  async getProjectActivity(projectId: string, limit = 8) {
    const res = await apiClient.get(`/projects/${projectId}/activity`, {
      params: { limit },
    });
    return res.data;
  },
};
