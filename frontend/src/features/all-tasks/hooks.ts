import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { fetchAllTasks, fetchAllTasksMeta, fetchMyTasks } from './api';
import type { AllTasksQuery } from './types';

export const allTasksKeys = {
  all: ['all-tasks'] as const,
  list: (workspaceId: string, query: AllTasksQuery) =>
    [...allTasksKeys.all, workspaceId, query] as const,
  meta: (workspaceId: string) => [...allTasksKeys.all, workspaceId, 'meta'] as const,
  my: (workspaceId: string) => [...allTasksKeys.all, workspaceId, 'my'] as const,
};

export function useAllTasksQuery(workspaceId: string | null, query: AllTasksQuery) {
  return useQuery({
    queryKey: allTasksKeys.list(workspaceId ?? '', query),
    queryFn: async () => {
      const response = await fetchAllTasks(workspaceId!, query);
      return response.data;
    },
    enabled: Boolean(workspaceId),
    placeholderData: keepPreviousData,
  });
}

export function useAllTasksMetaQuery(workspaceId: string | null) {
  return useQuery({
    queryKey: allTasksKeys.meta(workspaceId ?? ''),
    queryFn: async () => {
      const response = await fetchAllTasksMeta(workspaceId!);
      return response.data;
    },
    enabled: Boolean(workspaceId),
    staleTime: 5 * 60_000,
  });
}

export function useMyTasksQuery(workspaceId: string | null, limit = 50) {
  return useQuery({
    queryKey: allTasksKeys.my(workspaceId ?? ''),
    queryFn: async () => {
      const response = await fetchMyTasks(workspaceId!, limit);
      return response.data;
    },
    enabled: Boolean(workspaceId),
  });
}
