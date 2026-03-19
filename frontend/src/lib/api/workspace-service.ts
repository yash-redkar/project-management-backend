import { apiClient } from "./client";
import type { WorkspaceListResponse } from "@/types/workspace-api";

export async function getWorkspaces() {
  const response = await apiClient.get<WorkspaceListResponse>("/workspaces");
  return response.data;
}
