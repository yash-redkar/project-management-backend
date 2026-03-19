import { apiClient } from "@/lib/api/client";

export const chatService = {
  async getWorkspaceConversation(workspaceId: string) {
    const res = await apiClient.get(
      `/chat/workspaces/${workspaceId}/conversation`,
    );
    return res.data;
  },

  async getProjectConversation(workspaceId: string, projectId: string) {
    const res = await apiClient.get(
      `/chat/workspaces/${workspaceId}/projects/${projectId}/conversation`,
    );
    return res.data;
  },

  async getConversationMessages(
    conversationId: string,
    options?: {
      cursor?: string | null;
      limit?: number;
    },
  ) {
    const params: Record<string, string | number> = {};

    if (options?.cursor) {
      params.cursor = options.cursor;
    }

    if (options?.limit) {
      params.limit = options.limit;
    }

    const res = await apiClient.get(
      `/chat/conversations/${conversationId}/messages`,
      { params },
    );

    return res.data;
  },

  async sendMessage(
    conversationId: string,
    payload: {
      text: string;
    },
  ) {
    const res = await apiClient.post(
      `/chat/conversations/${conversationId}/messages`,
      payload,
    );
    return res.data;
  },
};
