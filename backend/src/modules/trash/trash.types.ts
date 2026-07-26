export const TrashEntityType = {
  TASK: 'TASK',
  DEAL: 'DEAL',
  APP: 'APP',
} as const;

export type TrashEntityType = (typeof TrashEntityType)[keyof typeof TrashEntityType];

export interface TrashItem {
  entityType: TrashEntityType;
  entityId: string;
  entityName: string;

  deletedAt: string;
  metadata: Record<string, string | number | boolean | null>;
}

export interface ListTrashResult {
  items: TrashItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}
