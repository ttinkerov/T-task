import { apiFetch } from '@/shared/api/client';
import type { NotificationInbox } from './types';

function withWorkspace(workspaceId: string) {
  return { 'x-workspace-id': workspaceId };
}

export function fetchNotifications(workspaceId: string) {
  return apiFetch<NotificationInbox>(`/api/v1/workspaces/${workspaceId}/notifications`, {
    headers: withWorkspace(workspaceId),
  });
}

export function markNotificationRead(workspaceId: string, notificationId: string) {
  return apiFetch<{ success: true }>(
    `/api/v1/workspaces/${workspaceId}/notifications/${notificationId}/read`,
    {
      method: 'PATCH',
      headers: withWorkspace(workspaceId),
    },
  );
}

export function markAllNotificationsRead(workspaceId: string) {
  return apiFetch<{ success: true; updated: number }>(
    `/api/v1/workspaces/${workspaceId}/notifications/read-all`,
    {
      method: 'PATCH',
      headers: withWorkspace(workspaceId),
    },
  );
}
