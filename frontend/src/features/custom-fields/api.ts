import { apiFetch } from '@/shared/api/client';
import type {
  CreateCustomFieldPayload,
  CustomFieldDefinition,
  CustomFieldValue,
  UpdateCustomFieldPayload,
} from './types';

function withWorkspace(workspaceId: string) {
  return { 'x-workspace-id': workspaceId };
}

export function fetchCustomFields(workspaceId: string) {
  return apiFetch<CustomFieldDefinition[]>(`/api/v1/workspaces/${workspaceId}/custom-fields`, {
    headers: withWorkspace(workspaceId),
  });
}

export function createCustomField(workspaceId: string, data: CreateCustomFieldPayload) {
  return apiFetch<CustomFieldDefinition>(`/api/v1/workspaces/${workspaceId}/custom-fields`, {
    method: 'POST',
    headers: withWorkspace(workspaceId),
    body: JSON.stringify(data),
  });
}

export function updateCustomField(
  workspaceId: string,
  fieldId: string,
  data: UpdateCustomFieldPayload,
) {
  return apiFetch<CustomFieldDefinition>(
    `/api/v1/workspaces/${workspaceId}/custom-fields/${fieldId}`,
    {
      method: 'PATCH',
      headers: withWorkspace(workspaceId),
      body: JSON.stringify(data),
    },
  );
}

export function deleteCustomField(workspaceId: string, fieldId: string) {
  return apiFetch<{ success: true }>(`/api/v1/workspaces/${workspaceId}/custom-fields/${fieldId}`, {
    method: 'DELETE',
    headers: withWorkspace(workspaceId),
  });
}

export function setTaskCustomField(
  workspaceId: string,
  taskId: string,
  fieldId: string,
  value: CustomFieldValue,
) {
  return apiFetch<{ fieldId: string; value: CustomFieldValue }>(
    `/api/v1/workspaces/${workspaceId}/tasks/${taskId}/custom-fields/${fieldId}`,
    {
      method: 'PUT',
      headers: withWorkspace(workspaceId),
      body: JSON.stringify({ value }),
    },
  );
}
