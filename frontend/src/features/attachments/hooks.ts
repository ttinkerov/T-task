import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteAttachment, fetchAttachments, uploadAttachment } from './api';

export const attachmentKeys = {
  all: ['attachments'] as const,
  list: (workspaceId: string, taskId: string) =>
    [...attachmentKeys.all, workspaceId, taskId] as const,
};

export function useAttachmentsQuery(workspaceId: string, taskId: string) {
  return useQuery({
    queryKey: attachmentKeys.list(workspaceId, taskId),
    queryFn: async () => {
      const response = await fetchAttachments(workspaceId, taskId);
      return response.data ?? [];
    },
    enabled: Boolean(workspaceId && taskId),
  });
}

export function useUploadAttachmentMutation(workspaceId: string, taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const response = await uploadAttachment(workspaceId, taskId, file);
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: attachmentKeys.list(workspaceId, taskId),
      });
    },
  });
}

export function useDeleteAttachmentMutation(workspaceId: string, taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (attachmentId: string) => {
      await deleteAttachment(workspaceId, taskId, attachmentId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: attachmentKeys.list(workspaceId, taskId),
      });
    },
  });
}
