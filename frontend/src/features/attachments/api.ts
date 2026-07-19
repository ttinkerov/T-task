import { apiFetch, apiUpload } from '@/shared/api/client';
import { getApiBaseUrl } from '@/shared/lib/env';
import type { TaskAttachment } from './types';

function withWorkspace(workspaceId: string) {
  return { 'x-workspace-id': workspaceId };
}

function attachmentsBase(workspaceId: string, taskId: string) {
  return `/api/v1/workspaces/${workspaceId}/tasks/${taskId}/attachments`;
}

export async function fetchAttachments(workspaceId: string, taskId: string) {
  return apiFetch<TaskAttachment[]>(attachmentsBase(workspaceId, taskId), {
    headers: withWorkspace(workspaceId),
  });
}

export async function uploadAttachment(workspaceId: string, taskId: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return apiUpload<TaskAttachment>(attachmentsBase(workspaceId, taskId), formData, {
    headers: withWorkspace(workspaceId),
  });
}

export async function deleteAttachment(workspaceId: string, taskId: string, attachmentId: string) {
  return apiFetch<{ deleted: true }>(`${attachmentsBase(workspaceId, taskId)}/${attachmentId}`, {
    method: 'DELETE',
    headers: withWorkspace(workspaceId),
  });
}

export function attachmentContentUrl(
  workspaceId: string,
  taskId: string,
  attachmentId: string,
): string {
  return `${getApiBaseUrl()}${attachmentsBase(workspaceId, taskId)}/${attachmentId}/content`;
}
