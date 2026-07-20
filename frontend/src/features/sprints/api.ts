import { apiFetch } from '@/shared/api/client';
import type { CreateSprintPayload, Sprint, SprintBurndown } from './types';

function withWorkspace(workspaceId: string) {
  return { 'x-workspace-id': workspaceId };
}

export function fetchSprints(workspaceId: string) {
  return apiFetch<Sprint[]>(`/api/v1/workspaces/${workspaceId}/sprints`, {
    headers: withWorkspace(workspaceId),
  });
}

export function createSprint(workspaceId: string, data: CreateSprintPayload) {
  return apiFetch<Sprint>(`/api/v1/workspaces/${workspaceId}/sprints`, {
    method: 'POST',
    headers: withWorkspace(workspaceId),
    body: JSON.stringify(data),
  });
}

export function closeSprint(workspaceId: string, sprintId: string) {
  return apiFetch<Sprint>(`/api/v1/workspaces/${workspaceId}/sprints/${sprintId}/close`, {
    method: 'PATCH',
    headers: withWorkspace(workspaceId),
  });
}

export function fetchSprintBurndown(workspaceId: string, sprintId: string) {
  return apiFetch<SprintBurndown>(
    `/api/v1/workspaces/${workspaceId}/sprints/${sprintId}/burndown`,
    { headers: withWorkspace(workspaceId) },
  );
}
