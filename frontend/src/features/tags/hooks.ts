import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invalidateBoardScoped, invalidateWorkspaceBoards } from '@/features/boards/hooks';
import { createTag, deleteTag, fetchTags, setTaskTags, updateTag } from './api';

export const tagKeys = {
  all: ['tags'] as const,
  list: (workspaceId: string) => [...tagKeys.all, workspaceId] as const,
};

export function useTagsQuery(workspaceId: string | null) {
  return useQuery({
    queryKey: tagKeys.list(workspaceId ?? ''),
    queryFn: async () => {
      const response = await fetchTags(workspaceId!);
      return response.data ?? [];
    },
    enabled: Boolean(workspaceId),
  });
}

function invalidateTagCatalog(queryClient: ReturnType<typeof useQueryClient>, workspaceId: string) {
  void queryClient.invalidateQueries({ queryKey: tagKeys.list(workspaceId) });
  invalidateWorkspaceBoards(queryClient, workspaceId);
  void queryClient.invalidateQueries({ queryKey: ['all-tasks', workspaceId] });
}

function invalidateTaskTags(
  queryClient: ReturnType<typeof useQueryClient>,
  workspaceId: string,
  boardId?: string | null,
) {
  void queryClient.invalidateQueries({ queryKey: tagKeys.list(workspaceId) });
  invalidateBoardScoped(queryClient, workspaceId, boardId);
  void queryClient.invalidateQueries({ queryKey: ['all-tasks', workspaceId] });
}

export function useCreateTagMutation(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; color?: string }) => {
      const response = await createTag(workspaceId, data);
      return response.data;
    },
    onSuccess: () => invalidateTagCatalog(queryClient, workspaceId),
  });
}

export function useUpdateTagMutation(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      tagId,
      data,
    }: {
      tagId: string;
      data: { name?: string; color?: string };
    }) => {
      const response = await updateTag(workspaceId, tagId, data);
      return response.data;
    },
    onSuccess: () => invalidateTagCatalog(queryClient, workspaceId),
  });
}

export function useDeleteTagMutation(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (tagId: string) => {
      await deleteTag(workspaceId, tagId);
    },
    onSuccess: () => invalidateTagCatalog(queryClient, workspaceId),
  });
}

export function useSetTaskTagsMutation(
  workspaceId: string,
  taskId: string,
  boardId?: string | null,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (tagIds: string[]) => {
      const response = await setTaskTags(workspaceId, taskId, tagIds);
      return response.data ?? [];
    },
    onSuccess: () => invalidateTaskTags(queryClient, workspaceId, boardId),
  });
}
