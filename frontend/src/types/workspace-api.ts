export interface WorkspaceApiItem {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  plan?: string;
}

export interface WorkspaceListResponse {
  statusCode: number;
  data: Array<{
    workspace: {
      _id: string;
      name: string;
      slug: string;
      plan?: string;
      createdAt?: string;
      createdBy?: string;
    };
    role: string;
    status: string;
  }>;
  message: string;
  success?: boolean;
}
