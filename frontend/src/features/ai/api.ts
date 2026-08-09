import { apiFetch } from '@/shared/api/client';
import type {
  AiChatPayload,
  AiChatResult,
  AiRagStatus,
  AiSettings,
  AiSummaryPayload,
  AiSummaryResult,
  AiTestResult,
  ApplyEpicBreakdownPayload,
  ApplyEpicBreakdownResult,
  ProposeEpicBreakdownPayload,
  ProposeEpicBreakdownResult,
  UpsertAiSettingsPayload,
} from './types';

function withWorkspace(workspaceId: string) {
  return { 'x-workspace-id': workspaceId };
}

export function fetchAiSettings(workspaceId: string) {
  return apiFetch<AiSettings>(`/api/v1/workspaces/${workspaceId}/ai/settings`, {
    headers: withWorkspace(workspaceId),
  });
}

export function upsertAiSettings(workspaceId: string, data: UpsertAiSettingsPayload) {
  return apiFetch<AiSettings>(`/api/v1/workspaces/${workspaceId}/ai/settings`, {
    method: 'PUT',
    headers: withWorkspace(workspaceId),
    body: JSON.stringify(data),
  });
}

export function deleteAiSettings(workspaceId: string) {
  return apiFetch<{ success: boolean }>(`/api/v1/workspaces/${workspaceId}/ai/settings`, {
    method: 'DELETE',
    headers: withWorkspace(workspaceId),
  });
}

export function testAiConnection(workspaceId: string) {
  return apiFetch<AiTestResult>(`/api/v1/workspaces/${workspaceId}/ai/settings/test`, {
    method: 'POST',
    headers: withWorkspace(workspaceId),
  });
}

export function fetchAiRagStatus(workspaceId: string) {
  return apiFetch<AiRagStatus>(`/api/v1/workspaces/${workspaceId}/ai/rag/status`, {
    headers: withWorkspace(workspaceId),
  });
}

export function reindexAiRag(workspaceId: string) {
  return apiFetch<AiRagStatus & { tasks: number; comments: number }>(
    `/api/v1/workspaces/${workspaceId}/ai/rag/reindex`,
    {
      method: 'POST',
      headers: withWorkspace(workspaceId),
    },
  );
}

export function sendAiChat(workspaceId: string, data: AiChatPayload) {
  return apiFetch<AiChatResult>(`/api/v1/workspaces/${workspaceId}/ai/chat`, {
    method: 'POST',
    headers: withWorkspace(workspaceId),
    body: JSON.stringify(data),
  });
}

export function fetchAiSummary(workspaceId: string, data: AiSummaryPayload) {
  return apiFetch<AiSummaryResult>(`/api/v1/workspaces/${workspaceId}/ai/summary`, {
    method: 'POST',
    headers: withWorkspace(workspaceId),
    body: JSON.stringify(data),
  });
}

export function proposeEpicBreakdown(
  workspaceId: string,
  epicId: string,
  data: ProposeEpicBreakdownPayload = {},
) {
  return apiFetch<ProposeEpicBreakdownResult>(
    `/api/v1/workspaces/${workspaceId}/ai/epics/${epicId}/breakdown`,
    {
      method: 'POST',
      headers: withWorkspace(workspaceId),
      body: JSON.stringify(data),
    },
  );
}

export function applyEpicBreakdown(
  workspaceId: string,
  epicId: string,
  data: ApplyEpicBreakdownPayload,
) {
  return apiFetch<ApplyEpicBreakdownResult>(
    `/api/v1/workspaces/${workspaceId}/ai/epics/${epicId}/breakdown/apply`,
    {
      method: 'POST',
      headers: withWorkspace(workspaceId),
      body: JSON.stringify(data),
    },
  );
}
