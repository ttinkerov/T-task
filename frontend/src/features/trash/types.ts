export type TrashEntityType = 'TASK' | 'DEAL' | 'APP';

export interface TrashItem {
  entityType: TrashEntityType;
  entityId: string;
  entityName: string;
  deletedAt: string;
  metadata: Record<string, string | number | boolean | null>;
}

export interface TrashPage {
  items: TrashItem[];
  total: number;
  page: number;
  limit: number;
}
