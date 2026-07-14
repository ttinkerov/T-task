import { apiFetch } from '@/shared/api/client';
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

export async function createFunnel(workspaceId: string, name: string) {
  return apiFetch<FunnelSummary>(`/api/v1/workspaces/${workspaceId}/funnels`, {
    method: 'POST',
    headers: withWorkspace(workspaceId),
    body: JSON.stringify({ name }),
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
