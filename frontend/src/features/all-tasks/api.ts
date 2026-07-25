import { apiFetch } from '@/shared/api/client';
import type { AllTasksQuery, AllTasksResult, MyTasksResult } from './types';

export async function fetchAllTasks(workspaceId: string, query: AllTasksQuery) {
  const searchParams = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === '' || value === false || value === null || value === undefined) {
      return;
    }
    searchParams.set(key, String(value));
  });

  return apiFetch<AllTasksResult>(
    `/api/v1/workspaces/${workspaceId}/all-tasks?${searchParams.toString()}`,
    { headers: { 'x-workspace-id': workspaceId } },
  );
}

export async function fetchMyTasks(workspaceId: string, limit = 50) {
  const searchParams = new URLSearchParams({ limit: String(limit) });
  return apiFetch<MyTasksResult>(
    `/api/v1/workspaces/${workspaceId}/my-tasks?${searchParams.toString()}`,
    { headers: { 'x-workspace-id': workspaceId } },
  );
}
