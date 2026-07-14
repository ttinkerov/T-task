import { apiFetch } from '@/shared/api/client';
import type {
  FormFieldType,
  FormResponsesView,
  FormSummary,
  FormView,
  PublicFormView,
} from './types';

function withWorkspace(workspaceId: string) {
  return { 'x-workspace-id': workspaceId };
}

export async function fetchForms(workspaceId: string) {
  return apiFetch<FormSummary[]>(`/api/v1/workspaces/${workspaceId}/forms`, {
    headers: withWorkspace(workspaceId),
  });
}

export async function fetchForm(workspaceId: string, formId: string) {
  return apiFetch<FormView>(`/api/v1/workspaces/${workspaceId}/forms/${formId}`, {
    headers: withWorkspace(workspaceId),
  });
}

export async function createForm(
  workspaceId: string,
  data: { title: string; description?: string; createTaskOnSubmit?: boolean },
) {
  return apiFetch<FormView>(`/api/v1/workspaces/${workspaceId}/forms`, {
    method: 'POST',
    headers: withWorkspace(workspaceId),
    body: JSON.stringify(data),
  });
}

export async function updateForm(
  workspaceId: string,
  formId: string,
  data: {
    title?: string;
    description?: string | null;
    isPublic?: boolean;
    createTaskOnSubmit?: boolean;
  },
) {
  return apiFetch<FormView>(`/api/v1/workspaces/${workspaceId}/forms/${formId}`, {
    method: 'PATCH',
    headers: withWorkspace(workspaceId),
    body: JSON.stringify(data),
  });
}

export async function deleteForm(workspaceId: string, formId: string) {
  return apiFetch(`/api/v1/workspaces/${workspaceId}/forms/${formId}`, {
    method: 'DELETE',
    headers: withWorkspace(workspaceId),
  });
}

export async function addFormField(
  workspaceId: string,
  formId: string,
  data: {
    type: FormFieldType;
    label: string;
    options?: string[];
    required?: boolean;
  },
) {
  return apiFetch<FormView>(`/api/v1/workspaces/${workspaceId}/forms/${formId}/fields`, {
    method: 'POST',
    headers: withWorkspace(workspaceId),
    body: JSON.stringify(data),
  });
}

export async function updateFormField(
  workspaceId: string,
  formId: string,
  fieldId: string,
  data: {
    type?: FormFieldType;
    label?: string;
    options?: string[];
    required?: boolean;
  },
) {
  return apiFetch<FormView>(`/api/v1/workspaces/${workspaceId}/forms/${formId}/fields/${fieldId}`, {
    method: 'PATCH',
    headers: withWorkspace(workspaceId),
    body: JSON.stringify(data),
  });
}

export async function deleteFormField(workspaceId: string, formId: string, fieldId: string) {
  return apiFetch<FormView>(`/api/v1/workspaces/${workspaceId}/forms/${formId}/fields/${fieldId}`, {
    method: 'DELETE',
    headers: withWorkspace(workspaceId),
  });
}

export async function fetchFormResponses(workspaceId: string, formId: string) {
  return apiFetch<FormResponsesView>(
    `/api/v1/workspaces/${workspaceId}/forms/${formId}/responses`,
    {
      headers: withWorkspace(workspaceId),
    },
  );
}

export async function fetchPublicForm(token: string) {
  return apiFetch<PublicFormView>(`/api/v1/public/forms/${token}`);
}

export async function submitPublicForm(token: string, answers: Record<string, string | string[]>) {
  return apiFetch<{ id: string; createdAt: string }>(`/api/v1/public/forms/${token}/submit`, {
    method: 'POST',
    body: JSON.stringify({ answers }),
  });
}
