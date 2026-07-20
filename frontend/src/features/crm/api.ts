import { apiFetch } from '@/shared/api/client';
import type { DealTaskLink, TaskDealLink } from './deal-task-types';
import type { FunnelSummary, FunnelView, UpdateDealPayload } from './types';

function withWorkspace(workspaceId: string) {
  return { 'x-workspace-id': workspaceId };
}

export async function fetchFunnels(workspaceId: string) {
  return apiFetch<FunnelSummary[]>(`/api/v1/workspaces/${workspaceId}/funnels`, {
    headers: withWorkspace(workspaceId),
  });
}

export async function fetchFunnel(workspaceId: string, funnelId: string) {
  return apiFetch<FunnelView>(`/api/v1/workspaces/${workspaceId}/funnels/${funnelId}`, {
    headers: withWorkspace(workspaceId),
  });
}

export async function createFunnel(workspaceId: string, name: string, templateId?: string) {
  return apiFetch<FunnelSummary>(`/api/v1/workspaces/${workspaceId}/funnels`, {
    method: 'POST',
    headers: withWorkspace(workspaceId),
    body: JSON.stringify({ name, ...(templateId ? { templateId } : {}) }),
  });
}

export async function createStage(workspaceId: string, funnelId: string, name: string) {
  return apiFetch(`/api/v1/workspaces/${workspaceId}/funnels/${funnelId}/stages`, {
    method: 'POST',
    headers: withWorkspace(workspaceId),
    body: JSON.stringify({ name }),
  });
}

export async function updateStage(
  workspaceId: string,
  funnelId: string,
  stageId: string,
  name: string,
) {
  return apiFetch(`/api/v1/workspaces/${workspaceId}/funnels/${funnelId}/stages/${stageId}`, {
    method: 'PATCH',
    headers: withWorkspace(workspaceId),
    body: JSON.stringify({ name }),
  });
}

export async function deleteStage(workspaceId: string, funnelId: string, stageId: string) {
  return apiFetch(`/api/v1/workspaces/${workspaceId}/funnels/${funnelId}/stages/${stageId}`, {
    method: 'DELETE',
    headers: withWorkspace(workspaceId),
  });
}

export async function moveStage(
  workspaceId: string,
  funnelId: string,
  stageId: string,
  position: number,
) {
  return apiFetch(`/api/v1/workspaces/${workspaceId}/funnels/${funnelId}/stages/${stageId}/move`, {
    method: 'PATCH',
    headers: withWorkspace(workspaceId),
    body: JSON.stringify({ position }),
  });
}

export async function createDeal(
  workspaceId: string,
  data: { title: string; stageId: string; description?: string },
) {
  return apiFetch(`/api/v1/workspaces/${workspaceId}/deals`, {
    method: 'POST',
    headers: withWorkspace(workspaceId),
    body: JSON.stringify(data),
  });
}

export async function updateDeal(workspaceId: string, dealId: string, data: UpdateDealPayload) {
  return apiFetch(`/api/v1/workspaces/${workspaceId}/deals/${dealId}`, {
    method: 'PATCH',
    headers: withWorkspace(workspaceId),
    body: JSON.stringify(data),
  });
}

export async function moveDeal(
  workspaceId: string,
  dealId: string,
  data: { stageId: string; position: number },
) {
  return apiFetch(`/api/v1/workspaces/${workspaceId}/deals/${dealId}/move`, {
    method: 'PATCH',
    headers: withWorkspace(workspaceId),
    body: JSON.stringify(data),
  });
}

export async function deleteDeal(workspaceId: string, dealId: string) {
  return apiFetch(`/api/v1/workspaces/${workspaceId}/deals/${dealId}`, {
    method: 'DELETE',
    headers: withWorkspace(workspaceId),
  });
}

export async function fetchTaskDeals(workspaceId: string, taskId: string) {
  return apiFetch<TaskDealLink[]>(`/api/v1/workspaces/${workspaceId}/tasks/${taskId}/deals`, {
    headers: withWorkspace(workspaceId),
  });
}

export async function linkTaskDeal(workspaceId: string, taskId: string, dealId: string) {
  return apiFetch<TaskDealLink>(`/api/v1/workspaces/${workspaceId}/tasks/${taskId}/deals`, {
    method: 'POST',
    headers: withWorkspace(workspaceId),
    body: JSON.stringify({ dealId }),
  });
}

export async function unlinkTaskDeal(workspaceId: string, taskId: string, dealId: string) {
  return apiFetch<{ success: true }>(
    `/api/v1/workspaces/${workspaceId}/tasks/${taskId}/deals/${dealId}`,
    {
      method: 'DELETE',
      headers: withWorkspace(workspaceId),
    },
  );
}

export async function fetchDealTasks(workspaceId: string, dealId: string) {
  return apiFetch<DealTaskLink[]>(`/api/v1/workspaces/${workspaceId}/deals/${dealId}/tasks`, {
    headers: withWorkspace(workspaceId),
  });
}

export async function linkDealTask(workspaceId: string, dealId: string, taskId: string) {
  return apiFetch<DealTaskLink>(`/api/v1/workspaces/${workspaceId}/deals/${dealId}/tasks`, {
    method: 'POST',
    headers: withWorkspace(workspaceId),
    body: JSON.stringify({ taskId }),
  });
}

export async function unlinkDealTask(workspaceId: string, dealId: string, taskId: string) {
  return apiFetch<{ success: true }>(
    `/api/v1/workspaces/${workspaceId}/deals/${dealId}/tasks/${taskId}`,
    {
      method: 'DELETE',
      headers: withWorkspace(workspaceId),
    },
  );
}
