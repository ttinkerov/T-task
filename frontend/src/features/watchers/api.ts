import { apiFetch } from '@/shared/api/client';

export type TaskWatcherUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
};

export type TaskWatchersState = {
  watching: boolean;
  watchers: TaskWatcherUser[];
};

function withWorkspace(workspaceId: string) {
  return { 'x-workspace-id': workspaceId };
}

export function fetchTaskWatchers(workspaceId: string, taskId: string) {
  return apiFetch<TaskWatchersState>(`/api/v1/workspaces/${workspaceId}/tasks/${taskId}/watchers`, {
    headers: withWorkspace(workspaceId),
  });
}

export function watchTask(workspaceId: string, taskId: string) {
  return apiFetch<TaskWatchersState>(`/api/v1/workspaces/${workspaceId}/tasks/${taskId}/watchers`, {
    method: 'POST',
    headers: withWorkspace(workspaceId),
  });
}

export function unwatchTask(workspaceId: string, taskId: string) {
  return apiFetch<TaskWatchersState>(`/api/v1/workspaces/${workspaceId}/tasks/${taskId}/watchers`, {
    method: 'DELETE',
    headers: withWorkspace(workspaceId),
  });
}
