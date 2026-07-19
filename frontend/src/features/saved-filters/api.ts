import { apiFetch } from '@/shared/api/client';
import type {
  CreateSavedFilterPayload,
  SavedFilter,
  SavedFilterView,
  UpdateSavedFilterPayload,
} from './types';

function withWorkspace(workspaceId: string) {
  return { 'x-workspace-id': workspaceId };
}

export async function fetchSavedFilters(workspaceId: string, view?: SavedFilterView) {
  const query = view ? `?view=${encodeURIComponent(view)}` : '';
  return apiFetch<SavedFilter[]>(`/api/v1/workspaces/${workspaceId}/saved-filters${query}`, {
    headers: withWorkspace(workspaceId),
  });
}

export async function createSavedFilter(workspaceId: string, data: CreateSavedFilterPayload) {
  return apiFetch<SavedFilter>(`/api/v1/workspaces/${workspaceId}/saved-filters`, {
    method: 'POST',
    headers: withWorkspace(workspaceId),
    body: JSON.stringify(data),
  });
}

export async function updateSavedFilter(
  workspaceId: string,
  filterId: string,
  data: UpdateSavedFilterPayload,
) {
  return apiFetch<SavedFilter>(`/api/v1/workspaces/${workspaceId}/saved-filters/${filterId}`, {
    method: 'PATCH',
    headers: withWorkspace(workspaceId),
    body: JSON.stringify(data),
  });
}

export async function deleteSavedFilter(workspaceId: string, filterId: string) {
  return apiFetch<{ deleted: true }>(
    `/api/v1/workspaces/${workspaceId}/saved-filters/${filterId}`,
    {
      method: 'DELETE',
      headers: withWorkspace(workspaceId),
    },
  );
}
