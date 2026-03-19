import { apiClient } from "@/lib/api/client";

export const taskCommentService = {
  async getComments(workspaceId: string, projectId: string, taskId: string) {
    const res = await apiClient.get(
      `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/comments`,
    );
    return res.data;
  },

  async createComment(
    workspaceId: string,
    projectId: string,
    taskId: string,
    payload: {
      content: string;
      mentions?: string[];
    },
  ) {
    const res = await apiClient.post(
      `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/comments`,
      payload,
    );
    return res.data;
  },

  async updateComment(
    workspaceId: string,
    projectId: string,
    taskId: string,
    commentId: string,
    payload: {
      content: string;
      mentions?: string[];
    },
  ) {
    const res = await apiClient.patch(
      `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/comments/${commentId}`,
      payload,
    );
    return res.data;
  },

  async deleteComment(
    workspaceId: string,
    projectId: string,
    taskId: string,
    commentId: string,
  ) {
    const res = await apiClient.delete(
      `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/comments/${commentId}`,
    );
    return res.data;
  },
};
