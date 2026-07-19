import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invalidateWorkspaceBoards } from '@/features/boards/hooks';
import { crmKeys } from '@/features/crm/hooks';
import { externalAppKeys } from '@/features/apps/hooks';
import { useWorkspacesQuery } from '@/features/workspaces/hooks';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { fetchWorkspaceTrash, purgeTrashItem, restoreTrashItem } from './api';
import type { TrashEntityType } from './types';

export const trashKeys = {
  all: ['workspace-trash'] as const,
  list: (workspaceId: string, page: number, limit: number) =>
    [...trashKeys.all, workspaceId, page, limit] as const,
};

export function useWorkspaceTrashQuery(workspaceId: string | null, page: number, limit: number) {
  return useQuery({
    queryKey: trashKeys.list(workspaceId ?? '', page, limit),
    queryFn: () => fetchWorkspaceTrash(workspaceId!, page, limit),
    enabled: Boolean(workspaceId),
    placeholderData: keepPreviousData,
  });
}

export function useCanManageTrash() {
  const { data: workspaces = [], isLoading } = useWorkspacesQuery();
  const currentWorkspaceId = useWorkspaceStore((state) => state.currentWorkspaceId);
  const workspace = workspaces.find((item) => item.id === currentWorkspaceId);
  const canManage = workspace?.role === 'OWNER' || workspace?.role === 'ADMIN';
  const canPurge = workspace?.role === 'OWNER';

  return {
    canManage,
    canPurge,
    isLoading,
    workspaceId: currentWorkspaceId,
    role: workspace?.role,
  };
}

function invalidateRelatedQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  workspaceId: string,
) {
  void queryClient.invalidateQueries({ queryKey: trashKeys.all });
  invalidateWorkspaceBoards(queryClient, workspaceId);
  void queryClient.invalidateQueries({ queryKey: crmKeys.all });
  void queryClient.invalidateQueries({ queryKey: externalAppKeys.list(workspaceId) });
}

export function useRestoreTrashItemMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      entityType,
      entityId,
    }: {
      entityType: TrashEntityType;
      entityId: string;
    }) => {
      await restoreTrashItem(workspaceId, entityType, entityId);
    },
    onSuccess: () => {
      invalidateRelatedQueries(queryClient, workspaceId);
    },
  });
}

export function usePurgeTrashItemMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      entityType,
      entityId,
    }: {
      entityType: TrashEntityType;
      entityId: string;
    }) => {
      await purgeTrashItem(workspaceId, entityType, entityId);
    },
    onSuccess: () => {
      invalidateRelatedQueries(queryClient, workspaceId);
    },
  });
}
