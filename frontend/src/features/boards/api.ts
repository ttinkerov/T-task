import { apiFetch } from '@/shared/api/client';
import type { BoardView, UpdateTaskPayload } from './types';

function withWorkspace(workspaceId: string) {
  return { 'x-workspace-id': workspaceId };
}

export async function fetchBoard(workspaceId: string) {
  return apiFetch<BoardView>(`/api/v1/workspaces/${workspaceId}/board`, {
    headers: withWorkspace(workspaceId),
  });
}

export async function createColumn(workspaceId: string, name: string) {
  return apiFetch(`/api/v1/workspaces/${workspaceId}/board/columns`, {
    method: 'POST',
    headers: withWorkspace(workspaceId),
    body: JSON.stringify({ name }),
  });
}

export async function moveColumn(workspaceId: string, columnId: string, position: number) {
  return apiFetch(`/api/v1/workspaces/${workspaceId}/board/columns/${columnId}/move`, {
    method: 'PATCH',
    headers: withWorkspace(workspaceId),
    body: JSON.stringify({ position }),
  });
}

export async function createTask(
  workspaceId: string,
  data: { title: string; columnId: string; description?: string },
) {
  return apiFetch(`/api/v1/workspaces/${workspaceId}/tasks`, {
    method: 'POST',
    headers: withWorkspace(workspaceId),
    body: JSON.stringify(data),
  });
}

export async function updateTask(workspaceId: string, taskId: string, data: UpdateTaskPayload) {
  return apiFetch(`/api/v1/workspaces/${workspaceId}/tasks/${taskId}`, {
    method: 'PATCH',
    headers: withWorkspace(workspaceId),
    body: JSON.stringify(data),
  });
}

export async function moveTask(
  workspaceId: string,
  taskId: string,
  data: { columnId: string; position: number },
) {
  return apiFetch(`/api/v1/workspaces/${workspaceId}/tasks/${taskId}/move`, {
    method: 'PATCH',
    headers: withWorkspace(workspaceId),
    body: JSON.stringify(data),
  });
}

export async function deleteTask(workspaceId: string, taskId: string) {
  return apiFetch(`/api/v1/workspaces/${workspaceId}/tasks/${taskId}`, {
    method: 'DELETE',
    headers: withWorkspace(workspaceId),
  });
}
