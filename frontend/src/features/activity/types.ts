export interface WorkspaceActivity {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  entityName: string | null;
  actorName: string;
  metadata: Record<string, string | number | boolean | null>;
  createdAt: string;
}

export interface ActivityPage {
  items: WorkspaceActivity[];
  total: number;
  page: number;
  limit: number;
}
