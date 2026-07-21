import { apiFetch } from '@/shared/api/client';
import type { ImportTasksPayload, ImportTasksResult } from './types';

function withWorkspace(workspaceId: string) {
  return { 'x-workspace-id': workspaceId };
}

export function importTasks(workspaceId: string, data: ImportTasksPayload) {
  return apiFetch<ImportTasksResult>(`/api/v1/workspaces/${workspaceId}/import/tasks`, {
    method: 'POST',
    headers: withWorkspace(workspaceId),
    body: JSON.stringify(data),
  });
}
