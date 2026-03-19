import { apiClient } from "@/lib/api/client";

export const projectMemberService = {
  async getProjectMembers(workspaceId: string, projectId: string) {
    const res = await apiClient.get(
      `/workspaces/${workspaceId}/projects/${projectId}/members`,
    );
    return res.data;
  },
};
