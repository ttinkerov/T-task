import { apiFetch } from '@/shared/api/client';
import type { CalendarFeedCreated, CalendarFeedStatus } from './types';

function withWorkspace(workspaceId: string) {
  return { 'x-workspace-id': workspaceId };
}

export function fetchCalendarFeedStatus(workspaceId: string) {
  return apiFetch<CalendarFeedStatus>(`/api/v1/workspaces/${workspaceId}/calendar-feed`, {
    headers: withWorkspace(workspaceId),
  });
}

export function createOrRotateCalendarFeed(workspaceId: string) {
  return apiFetch<CalendarFeedCreated>(`/api/v1/workspaces/${workspaceId}/calendar-feed`, {
    method: 'POST',
    headers: withWorkspace(workspaceId),
  });
}

export function revokeCalendarFeed(workspaceId: string) {
  return apiFetch<{ success: true }>(`/api/v1/workspaces/${workspaceId}/calendar-feed`, {
    method: 'DELETE',
    headers: withWorkspace(workspaceId),
  });
}
