import { apiFetch } from '@/shared/api/client';
import type { WorkspaceTag } from './types';

function withWorkspace(workspaceId: string) {
  return { 'x-workspace-id': workspaceId };
}

export async function fetchTags(workspaceId: string) {
  return apiFetch<WorkspaceTag[]>(`/api/v1/workspaces/${workspaceId}/tags`, {
    headers: withWorkspace(workspaceId),
  });
}

export async function createTag(workspaceId: string, data: { name: string; color?: string }) {
  return apiFetch<WorkspaceTag>(`/api/v1/workspaces/${workspaceId}/tags`, {
    method: 'POST',
    headers: withWorkspace(workspaceId),
    body: JSON.stringify(data),
  });
}

export async function updateTag(
  workspaceId: string,
  tagId: string,
  data: { name?: string; color?: string },
) {
  return apiFetch<WorkspaceTag>(`/api/v1/workspaces/${workspaceId}/tags/${tagId}`, {
    method: 'PATCH',
    headers: withWorkspace(workspaceId),
    body: JSON.stringify(data),
  });
}

export async function deleteTag(workspaceId: string, tagId: string) {
  return apiFetch(`/api/v1/workspaces/${workspaceId}/tags/${tagId}`, {
    method: 'DELETE',
    headers: withWorkspace(workspaceId),
  });
}

export async function setTaskTags(workspaceId: string, taskId: string, tagIds: string[]) {
  return apiFetch<WorkspaceTag[]>(`/api/v1/workspaces/${workspaceId}/tasks/${taskId}/tags`, {
    method: 'PUT',
    headers: withWorkspace(workspaceId),
    body: JSON.stringify({ tagIds }),
  });
}
