import { apiClient } from "@/lib/api/client";

export const assistantService = {
  async askAssistant(payload: { workspaceId?: string; query: string }) {
    const res = await apiClient.post("/assistant/query", payload);
    return res.data;
  },
};
