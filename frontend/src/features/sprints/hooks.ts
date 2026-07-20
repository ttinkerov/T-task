import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { closeSprint, createSprint, fetchSprintBurndown, fetchSprints } from './api';
import type { CreateSprintPayload } from './types';

export const sprintKeys = {
  all: ['sprints'] as const,
  list: (workspaceId: string) => [...sprintKeys.all, workspaceId] as const,
  burndown: (workspaceId: string, sprintId: string) =>
    [...sprintKeys.all, workspaceId, 'burndown', sprintId] as const,
};

export function useSprintsQuery(workspaceId: string | null) {
  return useQuery({
    queryKey: sprintKeys.list(workspaceId ?? ''),
    queryFn: async () => {
      const response = await fetchSprints(workspaceId!);
      return response.data ?? [];
    },
    enabled: Boolean(workspaceId),
  });
}

export function useCreateSprintMutation(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateSprintPayload) => {
      const response = await createSprint(workspaceId, data);
      return response.data!;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: sprintKeys.list(workspaceId) });
    },
  });
}

export function useCloseSprintMutation(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sprintId: string) => {
      const response = await closeSprint(workspaceId, sprintId);
      return response.data!;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: sprintKeys.list(workspaceId) });
    },
  });
}

export function useSprintBurndownQuery(workspaceId: string | null, sprintId: string | null) {
  return useQuery({
    queryKey: sprintKeys.burndown(workspaceId ?? '', sprintId ?? ''),
    queryFn: async () => {
      const response = await fetchSprintBurndown(workspaceId!, sprintId!);
      return response.data!;
    },
    enabled: Boolean(workspaceId && sprintId),
  });
}
