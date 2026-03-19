import { apiClient } from "@/lib/api/client";

export const projectInviteService = {
  async acceptProjectInvite(token: string) {
    const res = await apiClient.get(`/invites/project/${token}/accept`);
    return res.data;
  },
};
