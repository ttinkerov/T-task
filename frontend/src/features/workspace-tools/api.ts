import { apiFetch } from '@/shared/api/client';
import { getApiBaseUrl } from '@/shared/lib/env';

export type SearchResult = {
  tasks: Array<{
    id: string;
    title: string;
    boardId: string;
    columnName?: string;
    matchIn?: 'title' | 'description';
    snippet?: string | null;
    href: string;
  }>;
  deals: Array<{ id: string; title: string; funnelId: string; href: string }>;
  comments: Array<{
    id: string;
    preview: string;
    taskId: string;
    taskTitle: string;
    href: string;
  }>;
};

export async function searchWorkspace(workspaceId: string, q: string) {
  return apiFetch<SearchResult>(
    `/api/v1/workspaces/${workspaceId}/search?q=${encodeURIComponent(q)}&limit=12`,
    { headers: { 'x-workspace-id': workspaceId } },
  );
}

export type AnalyticsSummary = {
  from: string;
  to: string;
  throughput: number;
  avgCycleTimeHours: number;
  medianCycleTimeHours: number;
  overdueCount: number;
};

export type AnalyticsWorkloadTask = {
  id: string;
  title: string;
  assigneeId: string | null;
  dueDate: string | null;
  timeEstimateMinutes: number | null;
  actualMinutes: number | null;
  columnName: string;
  assignee: { id: string; name: string; email: string; avatarUrl: string | null } | null;
};

export type AnalyticsWorkload = {
  boardId: string | null;
  truncated: boolean;
  tasks: AnalyticsWorkloadTask[];
};

export async function fetchAnalyticsSummary(workspaceId: string, from?: string, to?: string) {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const qs = params.toString();
  return apiFetch<AnalyticsSummary>(
    `/api/v1/workspaces/${workspaceId}/analytics/summary${qs ? `?${qs}` : ''}`,
    { headers: { 'x-workspace-id': workspaceId } },
  );
}

export async function fetchAnalyticsWorkload(workspaceId: string) {
  return apiFetch<AnalyticsWorkload>(`/api/v1/workspaces/${workspaceId}/analytics/workload`, {
    headers: { 'x-workspace-id': workspaceId },
  });
}

export type BoardTemplate = {
  id: string;
  name: string;
  description: string;
  columns: string[];
};

export async function fetchBoardTemplates(workspaceId: string) {
  return apiFetch<BoardTemplate[]>(`/api/v1/workspaces/${workspaceId}/boards/templates`, {
    headers: { 'x-workspace-id': workspaceId },
  });
}

export type FunnelTemplate = {
  id: string;
  name: string;
  description: string;
  stages: string[];
};

export async function fetchFunnelTemplates(workspaceId: string) {
  return apiFetch<FunnelTemplate[]>(`/api/v1/workspaces/${workspaceId}/funnels/templates`, {
    headers: { 'x-workspace-id': workspaceId },
  });
}

export async function downloadExport(workspaceId: string, kind: 'tasks' | 'deals') {
  const baseUrl = getApiBaseUrl().replace(/\/$/, '');
  const response = await fetch(`${baseUrl}/api/v1/workspaces/${workspaceId}/export/${kind}.csv`, {
    credentials: 'include',
    headers: { 'x-workspace-id': workspaceId },
  });
  if (!response.ok) {
    throw new Error('Не удалось скачать экспорт');
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${kind}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}
