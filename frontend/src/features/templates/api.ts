import { apiFetch } from '@/shared/api/client';
import type {
  CreateDealTemplatePayload,
  CreateTaskTemplatePayload,
  DealTemplate,
  TaskTemplate,
  UpdateDealTemplatePayload,
  UpdateTaskTemplatePayload,
} from './types';

function withWorkspace(workspaceId: string) {
  return { 'x-workspace-id': workspaceId };
}

export function fetchTaskTemplates(workspaceId: string) {
  return apiFetch<TaskTemplate[]>(`/api/v1/workspaces/${workspaceId}/task-templates`, {
    headers: withWorkspace(workspaceId),
  });
}

export function createTaskTemplate(workspaceId: string, data: CreateTaskTemplatePayload) {
  return apiFetch<TaskTemplate>(`/api/v1/workspaces/${workspaceId}/task-templates`, {
    method: 'POST',
    headers: withWorkspace(workspaceId),
    body: JSON.stringify(data),
  });
}

export function updateTaskTemplate(
  workspaceId: string,
  templateId: string,
  data: UpdateTaskTemplatePayload,
) {
  return apiFetch<TaskTemplate>(`/api/v1/workspaces/${workspaceId}/task-templates/${templateId}`, {
    method: 'PATCH',
    headers: withWorkspace(workspaceId),
    body: JSON.stringify(data),
  });
}

export function deleteTaskTemplate(workspaceId: string, templateId: string) {
  return apiFetch(`/api/v1/workspaces/${workspaceId}/task-templates/${templateId}`, {
    method: 'DELETE',
    headers: withWorkspace(workspaceId),
  });
}

export function seedTaskTemplates(workspaceId: string) {
  return apiFetch<TaskTemplate[]>(
    `/api/v1/workspaces/${workspaceId}/task-templates/seed-defaults`,
    {
      method: 'POST',
      headers: withWorkspace(workspaceId),
    },
  );
}

export function fetchDealTemplates(workspaceId: string) {
  return apiFetch<DealTemplate[]>(`/api/v1/workspaces/${workspaceId}/deal-templates`, {
    headers: withWorkspace(workspaceId),
  });
}

export function createDealTemplate(workspaceId: string, data: CreateDealTemplatePayload) {
  return apiFetch<DealTemplate>(`/api/v1/workspaces/${workspaceId}/deal-templates`, {
    method: 'POST',
    headers: withWorkspace(workspaceId),
    body: JSON.stringify(data),
  });
}

export function updateDealTemplate(
  workspaceId: string,
  templateId: string,
  data: UpdateDealTemplatePayload,
) {
  return apiFetch<DealTemplate>(`/api/v1/workspaces/${workspaceId}/deal-templates/${templateId}`, {
    method: 'PATCH',
    headers: withWorkspace(workspaceId),
    body: JSON.stringify(data),
  });
}

export function deleteDealTemplate(workspaceId: string, templateId: string) {
  return apiFetch(`/api/v1/workspaces/${workspaceId}/deal-templates/${templateId}`, {
    method: 'DELETE',
    headers: withWorkspace(workspaceId),
  });
}

export function seedDealTemplates(workspaceId: string) {
  return apiFetch<DealTemplate[]>(
    `/api/v1/workspaces/${workspaceId}/deal-templates/seed-defaults`,
    {
      method: 'POST',
      headers: withWorkspace(workspaceId),
    },
  );
}
