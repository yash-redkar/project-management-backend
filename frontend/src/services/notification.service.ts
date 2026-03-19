import { apiClient } from "@/lib/api/client";

export const notificationService = {
  async getNotifications(limit = 20) {
    const res = await apiClient.get("/notifications", {
      params: { limit },
    });
    return res.data;
  },

  async markAsRead(notificationId: string) {
    const res = await apiClient.patch(`/notifications/${notificationId}/read`);
    return res.data;
  },

  async markAllAsRead() {
    const res = await apiClient.patch("/notifications/read-all");
    return res.data;
  },
};
