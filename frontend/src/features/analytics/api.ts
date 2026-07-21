import { apiFetch } from '@/shared/api/client';
import type { StuckTasksInsightResult, StuckTasksParams, StuckTasksResult } from './types';

function withWorkspace(workspaceId: string) {
  return { 'x-workspace-id': workspaceId };
}

function toQuery(params: StuckTasksParams) {
  const search = new URLSearchParams();
  if (params.days != null) search.set('days', String(params.days));
  if (params.boardId) search.set('boardId', params.boardId);
  if (params.assigneeId) search.set('assigneeId', params.assigneeId);
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export function fetchStuckTasks(workspaceId: string, params: StuckTasksParams = {}) {
  return apiFetch<StuckTasksResult>(
    `/api/v1/workspaces/${workspaceId}/analytics/stuck-tasks${toQuery(params)}`,
    { headers: withWorkspace(workspaceId) },
  );
}

export function fetchStuckTasksInsight(workspaceId: string, params: StuckTasksParams = {}) {
  return apiFetch<StuckTasksInsightResult>(
    `/api/v1/workspaces/${workspaceId}/ai/stuck-tasks/insight`,
    {
      method: 'POST',
      headers: withWorkspace(workspaceId),
      body: JSON.stringify(params),
    },
  );
}
