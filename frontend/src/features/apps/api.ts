import { apiFetch } from '@/shared/api/client';
import type { CreateExternalAppPayload, WorkspaceExternalApp } from './types';

function withWorkspace(workspaceId: string) {
  return { 'x-workspace-id': workspaceId };
}

export function fetchExternalApps(workspaceId: string) {
  return apiFetch<WorkspaceExternalApp[]>(`/api/v1/workspaces/${workspaceId}/apps`, {
    headers: withWorkspace(workspaceId),
  });
}

export function createExternalApp(workspaceId: string, data: CreateExternalAppPayload) {
  return apiFetch<WorkspaceExternalApp>(`/api/v1/workspaces/${workspaceId}/apps`, {
    method: 'POST',
    headers: withWorkspace(workspaceId),
    body: JSON.stringify(data),
  });
}

export function deleteExternalApp(workspaceId: string, appId: string) {
  return apiFetch<{ success: boolean }>(`/api/v1/workspaces/${workspaceId}/apps/${appId}`, {
    method: 'DELETE',
    headers: withWorkspace(workspaceId),
  });
}
