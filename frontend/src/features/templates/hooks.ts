import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tagKeys } from '@/features/tags/hooks';
import {
  createDealTemplate,
  createTaskTemplate,
  deleteDealTemplate,
  deleteTaskTemplate,
  fetchDealTemplates,
  fetchTaskTemplates,
  seedDealTemplates,
  seedTaskTemplates,
  updateDealTemplate,
  updateTaskTemplate,
} from './api';
import type {
  CreateDealTemplatePayload,
  CreateTaskTemplatePayload,
  UpdateDealTemplatePayload,
  UpdateTaskTemplatePayload,
} from './types';

export const templateKeys = {
  all: ['templates'] as const,
  tasks: (workspaceId: string) => [...templateKeys.all, 'tasks', workspaceId] as const,
  deals: (workspaceId: string) => [...templateKeys.all, 'deals', workspaceId] as const,
};

export function useTaskTemplatesQuery(workspaceId: string | null) {
  return useQuery({
    queryKey: templateKeys.tasks(workspaceId ?? ''),
    queryFn: async () => {
      const response = await fetchTaskTemplates(workspaceId!);
      return response.data ?? [];
    },
    enabled: Boolean(workspaceId),
  });
}

export function useDealTemplatesQuery(workspaceId: string | null) {
  return useQuery({
    queryKey: templateKeys.deals(workspaceId ?? ''),
    queryFn: async () => {
      const response = await fetchDealTemplates(workspaceId!);
      return response.data ?? [];
    },
    enabled: Boolean(workspaceId),
  });
}

export function useCreateTaskTemplateMutation(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateTaskTemplatePayload) => {
      const response = await createTaskTemplate(workspaceId, data);
      return response.data!;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: templateKeys.tasks(workspaceId) });
    },
  });
}

export function useUpdateTaskTemplateMutation(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      templateId,
      data,
    }: {
      templateId: string;
      data: UpdateTaskTemplatePayload;
    }) => {
      const response = await updateTaskTemplate(workspaceId, templateId, data);
      return response.data!;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: templateKeys.tasks(workspaceId) });
    },
  });
}

export function useDeleteTaskTemplateMutation(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (templateId: string) => {
      await deleteTaskTemplate(workspaceId, templateId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: templateKeys.tasks(workspaceId) });
    },
  });
}

export function useSeedTaskTemplatesMutation(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response = await seedTaskTemplates(workspaceId);
      return response.data ?? [];
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: templateKeys.tasks(workspaceId) });
      void queryClient.invalidateQueries({ queryKey: tagKeys.list(workspaceId) });
    },
  });
}

export function useCreateDealTemplateMutation(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateDealTemplatePayload) => {
      const response = await createDealTemplate(workspaceId, data);
      return response.data!;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: templateKeys.deals(workspaceId) });
    },
  });
}

export function useUpdateDealTemplateMutation(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      templateId,
      data,
    }: {
      templateId: string;
      data: UpdateDealTemplatePayload;
    }) => {
      const response = await updateDealTemplate(workspaceId, templateId, data);
      return response.data!;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: templateKeys.deals(workspaceId) });
    },
  });
}

export function useDeleteDealTemplateMutation(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (templateId: string) => {
      await deleteDealTemplate(workspaceId, templateId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: templateKeys.deals(workspaceId) });
    },
  });
}

export function useSeedDealTemplatesMutation(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response = await seedDealTemplates(workspaceId);
      return response.data ?? [];
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: templateKeys.deals(workspaceId) });
    },
  });
}
