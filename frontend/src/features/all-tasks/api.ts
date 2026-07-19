import { apiFetch } from '@/shared/api/client';
import type { AllTasksQuery, AllTasksResult } from './types';

export async function fetchAllTasks(workspaceId: string, query: AllTasksQuery) {
  const searchParams = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== '') {
      searchParams.set(key, String(value));
    }
  });

  return apiFetch<AllTasksResult>(
    `/api/v1/workspaces/${workspaceId}/all-tasks?${searchParams.toString()}`,
    { headers: { 'x-workspace-id': workspaceId } },
  );
}
