import { apiFetch } from '@/shared/api/client';
import type {
  BoardSummary,
  BoardTask,
  BoardView,
  ColumnAutomation,
  TaskComment,
  TaskRelation,
  TaskRelationType,
  UpdateColumnAutomationsPayload,
  UpdateTaskPayload,
  BulkUpdateTasksPayload,
  BulkUpdateTasksResult,
} from './types';

function withWorkspace(workspaceId: string) {
  return { 'x-workspace-id': workspaceId };
}

export async function fetchBoards(workspaceId: string) {
  return apiFetch<BoardSummary[]>(`/api/v1/workspaces/${workspaceId}/boards`, {
    headers: withWorkspace(workspaceId),
  });
}

export async function fetchBoard(workspaceId: string, boardId: string) {
  return apiFetch<BoardView>(`/api/v1/workspaces/${workspaceId}/boards/${boardId}`, {
    headers: withWorkspace(workspaceId),
  });
}

/** Legacy: first board in workspace (used when boardId is unknown). */
export async function fetchDefaultBoard(workspaceId: string) {
  return apiFetch<BoardView>(`/api/v1/workspaces/${workspaceId}/board`, {
    headers: withWorkspace(workspaceId),
  });
}

export async function fetchTask(workspaceId: string, taskId: string) {
  return apiFetch<BoardTask>(`/api/v1/workspaces/${workspaceId}/tasks/${taskId}`, {
    headers: withWorkspace(workspaceId),
  });
}

export async function createBoard(workspaceId: string, name: string, templateId?: string) {
  return apiFetch<BoardSummary>(`/api/v1/workspaces/${workspaceId}/boards`, {
    method: 'POST',
    headers: withWorkspace(workspaceId),
    body: JSON.stringify({ name, ...(templateId ? { templateId } : {}) }),
  });
}

export async function updateBoard(workspaceId: string, boardId: string, name: string) {
  return apiFetch<BoardSummary>(`/api/v1/workspaces/${workspaceId}/boards/${boardId}`, {
    method: 'PATCH',
    headers: withWorkspace(workspaceId),
    body: JSON.stringify({ name }),
  });
}

export async function deleteBoard(workspaceId: string, boardId: string) {
  return apiFetch<{ success: true }>(`/api/v1/workspaces/${workspaceId}/boards/${boardId}`, {
    method: 'DELETE',
    headers: withWorkspace(workspaceId),
  });
}

export async function createColumn(workspaceId: string, name: string, boardId?: string) {
  return apiFetch(`/api/v1/workspaces/${workspaceId}/board/columns`, {
    method: 'POST',
    headers: withWorkspace(workspaceId),
    body: JSON.stringify({ name, ...(boardId ? { boardId } : {}) }),
  });
}

export async function updateColumn(
  workspaceId: string,
  columnId: string,
  data: { name?: string; wipLimit?: number | null },
) {
  return apiFetch(`/api/v1/workspaces/${workspaceId}/board/columns/${columnId}`, {
    method: 'PATCH',
    headers: withWorkspace(workspaceId),
    body: JSON.stringify(data),
  });
}

export async function deleteColumn(workspaceId: string, columnId: string) {
  return apiFetch(`/api/v1/workspaces/${workspaceId}/board/columns/${columnId}`, {
    method: 'DELETE',
    headers: withWorkspace(workspaceId),
  });
}

export async function moveColumn(workspaceId: string, columnId: string, position: number) {
  return apiFetch(`/api/v1/workspaces/${workspaceId}/board/columns/${columnId}/move`, {
    method: 'PATCH',
    headers: withWorkspace(workspaceId),
    body: JSON.stringify({ position }),
  });
}

export async function updateColumnAutomations(
  workspaceId: string,
  columnId: string,
  data: UpdateColumnAutomationsPayload,
) {
  return apiFetch<ColumnAutomation[]>(
    `/api/v1/workspaces/${workspaceId}/board/columns/${columnId}/automations`,
    {
      method: 'PUT',
      headers: withWorkspace(workspaceId),
      body: JSON.stringify(data),
    },
  );
}

export async function createTask(
  workspaceId: string,
  data: { title: string; columnId: string; description?: string; templateId?: string },
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

export async function bulkUpdateTasks(workspaceId: string, data: BulkUpdateTasksPayload) {
  return apiFetch<BulkUpdateTasksResult>(`/api/v1/workspaces/${workspaceId}/tasks/bulk`, {
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

export async function duplicateTask(workspaceId: string, taskId: string) {
  return apiFetch<BoardTask>(`/api/v1/workspaces/${workspaceId}/tasks/${taskId}/duplicate`, {
    method: 'POST',
    headers: withWorkspace(workspaceId),
  });
}

export async function fetchComments(workspaceId: string, taskId: string) {
  return apiFetch<TaskComment[]>(`/api/v1/workspaces/${workspaceId}/tasks/${taskId}/comments`, {
    headers: withWorkspace(workspaceId),
  });
}

export async function createComment(workspaceId: string, taskId: string, body: string) {
  return apiFetch<TaskComment>(`/api/v1/workspaces/${workspaceId}/tasks/${taskId}/comments`, {
    method: 'POST',
    headers: withWorkspace(workspaceId),
    body: JSON.stringify({ body }),
  });
}

export async function deleteComment(workspaceId: string, taskId: string, commentId: string) {
  return apiFetch(`/api/v1/workspaces/${workspaceId}/tasks/${taskId}/comments/${commentId}`, {
    method: 'DELETE',
    headers: withWorkspace(workspaceId),
  });
}

export async function fetchTaskRelations(workspaceId: string, taskId: string) {
  return apiFetch<TaskRelation[]>(`/api/v1/workspaces/${workspaceId}/tasks/${taskId}/relations`, {
    headers: withWorkspace(workspaceId),
  });
}

export async function createTaskRelation(
  workspaceId: string,
  taskId: string,
  data: { relatedTaskId: string; type: TaskRelationType },
) {
  return apiFetch<TaskRelation>(`/api/v1/workspaces/${workspaceId}/tasks/${taskId}/relations`, {
    method: 'POST',
    headers: withWorkspace(workspaceId),
    body: JSON.stringify(data),
  });
}

export async function deleteTaskRelation(workspaceId: string, taskId: string, relationId: string) {
  return apiFetch<{ success: true }>(
    `/api/v1/workspaces/${workspaceId}/tasks/${taskId}/relations/${relationId}`,
    {
      method: 'DELETE',
      headers: withWorkspace(workspaceId),
    },
  );
}
