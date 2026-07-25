import { apiFetch } from '@/shared/api/client';

export interface WhiteboardPayload {
  snapshot: Record<string, unknown> | null;
  updatedAt: string | null;
  updatedBy: { id: string; name: string } | null;
}

export function fetchWhiteboard(workspaceId: string) {
  return apiFetch<WhiteboardPayload>(`/api/v1/workspaces/${workspaceId}/whiteboard`, {
    method: 'GET',
  });
}

export function saveWhiteboard(workspaceId: string, snapshot: Record<string, unknown>) {
  return apiFetch<WhiteboardPayload>(`/api/v1/workspaces/${workspaceId}/whiteboard`, {
    method: 'PUT',
    body: JSON.stringify({ snapshot }),
  });
}
