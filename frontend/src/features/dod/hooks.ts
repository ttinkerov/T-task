import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invalidateWorkspaceBoards } from '@/features/boards/hooks';
import {
  applyDodTemplate,
  createChecklistItem,
  createDodTemplate,
  deleteChecklistItem,
  deleteDodTemplate,
  fetchDodTemplates,
  fetchTaskChecklist,
  updateChecklistItem,
  updateDodTemplate,
} from './api';
import type { CreateDodTemplatePayload, UpdateDodTemplatePayload } from './types';

export const dodKeys = {
  all: ['dod'] as const,
  templates: (workspaceId: string) => [...dodKeys.all, 'templates', workspaceId] as const,
  checklist: (workspaceId: string, taskId: string) =>
    [...dodKeys.all, 'checklist', workspaceId, taskId] as const,
};

export function useDodTemplatesQuery(workspaceId: string | null) {
  return useQuery({
    queryKey: dodKeys.templates(workspaceId ?? ''),
    queryFn: async () => {
      const response = await fetchDodTemplates(workspaceId!);
      return response.data ?? [];
    },
    enabled: Boolean(workspaceId),
  });
}

export function useCreateDodTemplateMutation(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateDodTemplatePayload) => {
      const response = await createDodTemplate(workspaceId, data);
      return response.data!;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: dodKeys.templates(workspaceId) });
    },
  });
}

export function useUpdateDodTemplateMutation(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      templateId,
      data,
    }: {
      templateId: string;
      data: UpdateDodTemplatePayload;
    }) => {
      const response = await updateDodTemplate(workspaceId, templateId, data);
      return response.data!;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: dodKeys.templates(workspaceId) });
    },
  });
}

export function useDeleteDodTemplateMutation(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (templateId: string) => {
      await deleteDodTemplate(workspaceId, templateId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: dodKeys.templates(workspaceId) });
    },
  });
}

function invalidateChecklist(
  queryClient: ReturnType<typeof useQueryClient>,
  workspaceId: string,
  taskId: string,
) {
  void queryClient.invalidateQueries({ queryKey: dodKeys.checklist(workspaceId, taskId) });
  invalidateWorkspaceBoards(queryClient, workspaceId);
  void queryClient.invalidateQueries({ queryKey: ['all-tasks', workspaceId] });
}

export function useTaskChecklistQuery(workspaceId: string, taskId: string) {
  return useQuery({
    queryKey: dodKeys.checklist(workspaceId, taskId),
    queryFn: async () => {
      const response = await fetchTaskChecklist(workspaceId, taskId);
      return response.data ?? [];
    },
    enabled: Boolean(workspaceId && taskId),
  });
}

export function useCreateChecklistItemMutation(workspaceId: string, taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { text: string; required?: boolean }) => {
      const response = await createChecklistItem(workspaceId, taskId, data);
      return response.data!;
    },
    onSuccess: () => invalidateChecklist(queryClient, workspaceId, taskId),
  });
}

export function useApplyDodTemplateMutation(workspaceId: string, taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (templateId: string) => {
      const response = await applyDodTemplate(workspaceId, taskId, templateId);
      return response.data ?? [];
    },
    onSuccess: () => invalidateChecklist(queryClient, workspaceId, taskId),
  });
}

export function useUpdateChecklistItemMutation(workspaceId: string, taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      itemId,
      data,
    }: {
      itemId: string;
      data: { text?: string; completed?: boolean; required?: boolean };
    }) => {
      const response = await updateChecklistItem(workspaceId, taskId, itemId, data);
      return response.data!;
    },
    onSuccess: () => invalidateChecklist(queryClient, workspaceId, taskId),
  });
}

export function useDeleteChecklistItemMutation(workspaceId: string, taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) => {
      await deleteChecklistItem(workspaceId, taskId, itemId);
    },
    onSuccess: () => invalidateChecklist(queryClient, workspaceId, taskId),
  });
}
