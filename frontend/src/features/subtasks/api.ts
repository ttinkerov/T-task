import { apiFetch } from '@/shared/api/client';
import type { TaskSubtask } from '@/features/boards/types';

function withWorkspace(workspaceId: string) {
  return { 'x-workspace-id': workspaceId };
}

export async function fetchSubtasks(workspaceId: string, taskId: string) {
  return apiFetch<TaskSubtask[]>(`/api/v1/workspaces/${workspaceId}/tasks/${taskId}/subtasks`, {
    headers: withWorkspace(workspaceId),
  });
}

export async function createSubtask(workspaceId: string, taskId: string, title: string) {
  return apiFetch<TaskSubtask>(`/api/v1/workspaces/${workspaceId}/tasks/${taskId}/subtasks`, {
    method: 'POST',
    headers: withWorkspace(workspaceId),
    body: JSON.stringify({ title }),
  });
}

export async function updateSubtask(
  workspaceId: string,
  taskId: string,
  subtaskId: string,
  data: { title?: string; completed?: boolean },
) {
  return apiFetch<TaskSubtask>(
    `/api/v1/workspaces/${workspaceId}/tasks/${taskId}/subtasks/${subtaskId}`,
    {
      method: 'PATCH',
      headers: withWorkspace(workspaceId),
      body: JSON.stringify(data),
    },
  );
}

export async function deleteSubtask(workspaceId: string, taskId: string, subtaskId: string) {
  return apiFetch(`/api/v1/workspaces/${workspaceId}/tasks/${taskId}/subtasks/${subtaskId}`, {
    method: 'DELETE',
    headers: withWorkspace(workspaceId),
  });
}
