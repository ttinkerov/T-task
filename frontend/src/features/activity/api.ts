import { apiFetch } from '@/shared/api/client';
import type { ActivityPage, WorkspaceActivity } from './types';

export async function fetchWorkspaceActivity(
  workspaceId: string,
  page: number,
  limit: number,
  filters?: { action?: string; actorId?: string; from?: string; to?: string },
): Promise<ActivityPage> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (filters?.action) params.set('action', filters.action);
  if (filters?.actorId) params.set('actorId', filters.actorId);
  if (filters?.from) params.set('from', filters.from);
  if (filters?.to) params.set('to', filters.to);

  const response = await apiFetch<WorkspaceActivity[]>(
    `/api/v1/workspaces/${workspaceId}/activity?${params.toString()}`,
  );

  return {
    items: response.data ?? [],
    total: response.meta?.total ?? 0,
    page: response.meta?.page ?? page,
    limit: response.meta?.limit ?? limit,
  };
}
