import { apiFetch } from '@/shared/api/client';
import type { TrashEntityType, TrashItem, TrashPage } from './types';

export async function fetchWorkspaceTrash(
  workspaceId: string,
  page: number,
  limit: number,
): Promise<TrashPage> {
  const response = await apiFetch<TrashItem[]>(
    `/api/v1/workspaces/${workspaceId}/trash?page=${page}&limit=${limit}`,
  );

  return {
    items: response.data ?? [],
    total: response.meta?.total ?? 0,
    page: response.meta?.page ?? page,
    limit: response.meta?.limit ?? limit,
  };
}

export async function restoreTrashItem(
  workspaceId: string,
  entityType: TrashEntityType,
  entityId: string,
) {
  return apiFetch<{ success: true }>(
    `/api/v1/workspaces/${workspaceId}/trash/${entityType}/${entityId}/restore`,
    { method: 'POST' },
  );
}

export async function purgeTrashItem(
  workspaceId: string,
  entityType: TrashEntityType,
  entityId: string,
) {
  return apiFetch<{ success: true }>(
    `/api/v1/workspaces/${workspaceId}/trash/${entityType}/${entityId}`,
    { method: 'DELETE' },
  );
}
