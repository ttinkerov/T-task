import { apiFetch } from '@/shared/api/client';
import type {
  CreateDodTemplatePayload,
  DodTemplate,
  TaskChecklistItem,
  UpdateDodTemplatePayload,
} from './types';

function withWorkspace(workspaceId: string) {
  return { 'x-workspace-id': workspaceId };
}

export function fetchDodTemplates(workspaceId: string) {
  return apiFetch<DodTemplate[]>(`/api/v1/workspaces/${workspaceId}/dod-templates`, {
    headers: withWorkspace(workspaceId),
  });
}

export function createDodTemplate(workspaceId: string, data: CreateDodTemplatePayload) {
  return apiFetch<DodTemplate>(`/api/v1/workspaces/${workspaceId}/dod-templates`, {
    method: 'POST',
    headers: withWorkspace(workspaceId),
    body: JSON.stringify(data),
  });
}

export function updateDodTemplate(
  workspaceId: string,
  templateId: string,
  data: UpdateDodTemplatePayload,
) {
  return apiFetch<DodTemplate>(`/api/v1/workspaces/${workspaceId}/dod-templates/${templateId}`, {
    method: 'PATCH',
    headers: withWorkspace(workspaceId),
    body: JSON.stringify(data),
  });
}

export function deleteDodTemplate(workspaceId: string, templateId: string) {
  return apiFetch(`/api/v1/workspaces/${workspaceId}/dod-templates/${templateId}`, {
    method: 'DELETE',
    headers: withWorkspace(workspaceId),
  });
}

export function fetchTaskChecklist(workspaceId: string, taskId: string) {
  return apiFetch<TaskChecklistItem[]>(
    `/api/v1/workspaces/${workspaceId}/tasks/${taskId}/checklist`,
    { headers: withWorkspace(workspaceId) },
  );
}

export function createChecklistItem(
  workspaceId: string,
  taskId: string,
  data: { text: string; required?: boolean },
) {
  return apiFetch<TaskChecklistItem>(
    `/api/v1/workspaces/${workspaceId}/tasks/${taskId}/checklist`,
    {
      method: 'POST',
      headers: withWorkspace(workspaceId),
      body: JSON.stringify(data),
    },
  );
}

export function applyDodTemplate(workspaceId: string, taskId: string, templateId: string) {
  return apiFetch<TaskChecklistItem[]>(
    `/api/v1/workspaces/${workspaceId}/tasks/${taskId}/checklist/apply-template`,
    {
      method: 'POST',
      headers: withWorkspace(workspaceId),
      body: JSON.stringify({ templateId }),
    },
  );
}

export function updateChecklistItem(
  workspaceId: string,
  taskId: string,
  itemId: string,
  data: { text?: string; completed?: boolean; required?: boolean },
) {
  return apiFetch<TaskChecklistItem>(
    `/api/v1/workspaces/${workspaceId}/tasks/${taskId}/checklist/${itemId}`,
    {
      method: 'PATCH',
      headers: withWorkspace(workspaceId),
      body: JSON.stringify(data),
    },
  );
}

export function deleteChecklistItem(workspaceId: string, taskId: string, itemId: string) {
  return apiFetch(`/api/v1/workspaces/${workspaceId}/tasks/${taskId}/checklist/${itemId}`, {
    method: 'DELETE',
    headers: withWorkspace(workspaceId),
  });
}
