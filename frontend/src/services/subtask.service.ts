import { apiClient } from "@/lib/api/client";

export const subTaskService = {
  async getSubTasks(workspaceId: string, projectId: string, taskId: string) {
    const res = await apiClient.get(
      `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/subtasks`,
    );
    return res.data;
  },

  async createSubTask(
    workspaceId: string,
    projectId: string,
    taskId: string,
    payload: {
      title: string;
    },
  ) {
    const res = await apiClient.post(
      `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/subtasks`,
      payload,
    );
    return res.data;
  },

  async updateSubTask(
    workspaceId: string,
    projectId: string,
    taskId: string,
    subtaskId: string,
    payload: {
      title?: string;
      isCompleted?: boolean;
    },
  ) {
    const res = await apiClient.put(
      `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/subtasks/${subtaskId}`,
      payload,
    );
    return res.data;
  },

  async deleteSubTask(
    workspaceId: string,
    projectId: string,
    taskId: string,
    subtaskId: string,
  ) {
    const res = await apiClient.delete(
      `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/subtasks/${subtaskId}`,
    );
    return res.data;
  },
};
