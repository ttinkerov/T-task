'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import TaskAttachmentsSectionView from '@/vue/boards/TaskAttachmentsSection.vue';
import { attachmentContentUrl } from '../api';
import {
  useAttachmentsQuery,
  useDeleteAttachmentMutation,
  useUploadAttachmentMutation,
} from '../hooks';
import { ATTACHMENT_ACCEPT, ATTACHMENT_MAX_BYTES, type TaskAttachment } from '../types';

const EMPTY_ATTACHMENTS: TaskAttachment[] = [];

export function TaskAttachmentsSection({
  workspaceId,
  taskId,
}: {
  workspaceId: string;
  taskId: string;
}) {
  const {
    data,
    isLoading,
    isError,
    error: loadQueryError,
    refetch,
  } = useAttachmentsQuery(workspaceId, taskId);
  const attachments = data ?? EMPTY_ATTACHMENTS;
  const uploadMutation = useUploadAttachmentMutation(workspaceId, taskId);
  const deleteMutation = useDeleteAttachmentMutation(workspaceId, taskId);
  const [error, setError] = useState('');
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    const objectUrls: string[] = [];

    const loadThumbs = async () => {
      const images = attachments.filter((item) => item.isImage);
      if (images.length === 0) {
        setThumbnails((prev) => (Object.keys(prev).length === 0 ? prev : {}));
        return;
      }

      const next: Record<string, string> = {};

      await Promise.all(
        images.map(async (attachment) => {
          try {
            const response = await fetch(attachmentContentUrl(workspaceId, taskId, attachment.id), {
              credentials: 'include',
            });
            if (!response.ok) return;
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            objectUrls.push(url);
            next[attachment.id] = url;
          } catch {
            /* ignore */
          }
        }),
      );

      if (!cancelled) setThumbnails(next);
    };

    void loadThumbs();

    return () => {
      cancelled = true;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [attachments, taskId, workspaceId]);

  const onOpen = useCallback(
    (attachmentId: string) => {
      window.open(attachmentContentUrl(workspaceId, taskId, attachmentId), '_blank', 'noopener');
    },
    [taskId, workspaceId],
  );

  const onDelete = useCallback(
    async (attachmentId: string) => {
      setError('');
      try {
        await deleteMutation.mutateAsync(attachmentId);
      } catch (deleteError) {
        setError(deleteError instanceof Error ? deleteError.message : 'Не удалось удалить файл');
      }
    },
    [deleteMutation],
  );

  const onUpload = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return;
      setError('');
      const file = files[0];
      if (file.size > ATTACHMENT_MAX_BYTES) {
        setError('Максимальный размер файла — 5 МБ');
        return;
      }
      try {
        await uploadMutation.mutateAsync(file);
      } catch (uploadError) {
        setError(uploadError instanceof Error ? uploadError.message : 'Не удалось загрузить файл');
      }
    },
    [uploadMutation],
  );

  const viewProps = useMemo(
    () => ({
      taskId,
      attachments,
      thumbnails,
      accept: ATTACHMENT_ACCEPT,
      isLoading,
      isError,
      loadError: isError
        ? loadQueryError instanceof Error
          ? loadQueryError.message
          : 'Не удалось загрузить вложения'
        : '',
      uploadPending: uploadMutation.isPending,
      deletePending: deleteMutation.isPending,
      error: error || uploadMutation.error?.message || deleteMutation.error?.message || '',
      onOpen,
      onDelete,
      onUpload,
      onRetry: () => {
        void refetch();
      },
    }),
    [
      taskId,
      attachments,
      thumbnails,
      isLoading,
      isError,
      loadQueryError,
      uploadMutation.isPending,
      uploadMutation.error?.message,
      deleteMutation.isPending,
      deleteMutation.error?.message,
      error,
      onOpen,
      onDelete,
      onUpload,
      refetch,
    ],
  );

  return <VueIsland component={TaskAttachmentsSectionView} componentProps={viewProps} />;
}
