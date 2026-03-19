import { apiClient } from "@/lib/api/client";

export interface TaskAttachment {
  _id: string;
  url: string;
  public_id?: string;
  fileName?: string;
  originalname?: string;
  fileType?: string;
  mimetype?: string;
  size?: number;
  createdAt?: string;
  uploadedBy?: {
    _id: string;
    fullName?: string;
    username?: string;
    avatar?: string;
  };
}

export const taskAttachmentService = {
  async deleteAttachment(
    workspaceId: string,
    projectId: string,
    taskId: string,
    attachmentId: string,
  ) {
    const res = await apiClient.delete(
      `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/attachments/${attachmentId}`,
    );
    return res.data;
  },
};
