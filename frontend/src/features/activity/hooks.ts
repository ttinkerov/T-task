import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useWorkspacesQuery } from '@/features/workspaces/hooks';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { fetchWorkspaceActivity } from './api';

export type ActivityFilters = {
  action?: string;
  actorId?: string;
  from?: string;
  to?: string;
};

export const activityKeys = {
  all: ['workspace-activity'] as const,
  list: (workspaceId: string, page: number, limit: number, filters: ActivityFilters) =>
    [...activityKeys.all, workspaceId, page, limit, filters] as const,
};

export function useWorkspaceActivityQuery(
  workspaceId: string | null,
  page: number,
  limit: number,
  filters: ActivityFilters = {},
) {
  return useQuery({
    queryKey: activityKeys.list(workspaceId ?? '', page, limit, filters),
    queryFn: () => fetchWorkspaceActivity(workspaceId!, page, limit, filters),
    enabled: Boolean(workspaceId),
    placeholderData: keepPreviousData,
  });
}

export function useCanViewActivity() {
  const { data: workspaces = [], isLoading } = useWorkspacesQuery();
  const currentWorkspaceId = useWorkspaceStore((state) => state.currentWorkspaceId);
  const workspace = workspaces.find((item) => item.id === currentWorkspaceId);
  const canView = workspace?.role === 'OWNER' || workspace?.role === 'ADMIN';

  return {
    canView,
    isLoading,
    workspaceId: currentWorkspaceId,
  };
}
