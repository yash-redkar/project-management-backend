import { apiClient } from "@/lib/api/client";

export const workspaceInviteService = {
  async acceptWorkspaceInvite(token: string) {
    const res = await apiClient.get(`/invites/workspace/${token}/accept`);
    return res.data;
  },
};
