import { apiFetch } from '@/shared/api/client';
import type { ActivityPage, WorkspaceActivity } from './types';

export async function fetchWorkspaceActivity(
  workspaceId: string,
  page: number,
  limit: number,
): Promise<ActivityPage> {
  const response = await apiFetch<WorkspaceActivity[]>(
    `/api/v1/workspaces/${workspaceId}/activity?page=${page}&limit=${limit}`,
  );

  return {
    items: response.data ?? [],
    total: response.meta?.total ?? 0,
    page: response.meta?.page ?? page,
    limit: response.meta?.limit ?? limit,
  };
}
