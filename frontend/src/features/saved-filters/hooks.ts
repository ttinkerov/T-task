import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createSavedFilter, deleteSavedFilter, fetchSavedFilters, updateSavedFilter } from './api';
import type { CreateSavedFilterPayload, SavedFilterView, UpdateSavedFilterPayload } from './types';

export const savedFilterKeys = {
  all: ['saved-filters'] as const,
  list: (workspaceId: string, view?: SavedFilterView) =>
    [...savedFilterKeys.all, workspaceId, view ?? 'all'] as const,
};

export function useSavedFiltersQuery(workspaceId: string | null, view: SavedFilterView) {
  return useQuery({
    queryKey: savedFilterKeys.list(workspaceId ?? '', view),
    queryFn: async () => {
      const response = await fetchSavedFilters(workspaceId!, view);
      return response.data ?? [];
    },
    enabled: Boolean(workspaceId),
  });
}

export function useCreateSavedFilterMutation(workspaceId: string, view: SavedFilterView) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSavedFilterPayload) => {
      const response = await createSavedFilter(workspaceId, data);
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: savedFilterKeys.list(workspaceId, view) });
    },
  });
}

export function useUpdateSavedFilterMutation(workspaceId: string, view: SavedFilterView) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      filterId,
      data,
    }: {
      filterId: string;
      data: UpdateSavedFilterPayload;
    }) => {
      const response = await updateSavedFilter(workspaceId, filterId, data);
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: savedFilterKeys.list(workspaceId, view) });
    },
  });
}

export function useDeleteSavedFilterMutation(workspaceId: string, view: SavedFilterView) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (filterId: string) => {
      await deleteSavedFilter(workspaceId, filterId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: savedFilterKeys.list(workspaceId, view) });
    },
  });
}
