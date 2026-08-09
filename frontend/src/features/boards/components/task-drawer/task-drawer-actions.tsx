'use client';

import { useCallback, useMemo, useState } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import TaskDrawerActionsView from '@/vue/boards/TaskDrawerActions.vue';
import { useDeleteTaskMutation, useDuplicateTaskMutation } from '../../hooks';
import { copyTaskLink } from '../../lib/task-link';

export function TaskDrawerActions({
  workspaceId,
  taskId,
  linkSource,
  title,
  isSaving,
  saveError,
  onOpenTask,
  onClose,
}: {
  workspaceId: string;
  taskId: string;
  linkSource: 'board' | 'all-tasks' | 'my-tasks';
  title: string;
  isSaving: boolean;
  saveError: string | null | undefined;
  onOpenTask: (taskId: string) => void;
  onClose: () => void;
}) {
  const deleteMutation = useDeleteTaskMutation(workspaceId);
  const duplicateMutation = useDuplicateTaskMutation(workspaceId);
  const [linkCopied, setLinkCopied] = useState(false);
  const [actionError, setActionError] = useState('');

  const onDelete = useCallback(async () => {
    setActionError('');
    try {
      await deleteMutation.mutateAsync(taskId);
      onClose();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Не удалось удалить задачу');
    }
  }, [deleteMutation, taskId, onClose]);

  const onDuplicate = useCallback(async () => {
    setActionError('');
    try {
      const copy = await duplicateMutation.mutateAsync(taskId);
      if (copy?.id) {
        onOpenTask(copy.id);
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Не удалось дублировать задачу');
    }
  }, [duplicateMutation, taskId, onOpenTask]);

  const onCopyLink = useCallback(async () => {
    setActionError('');
    try {
      await copyTaskLink(taskId, linkSource);
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Не удалось скопировать ссылку');
    }
  }, [taskId, linkSource]);

  const viewProps = useMemo(
    () => ({
      isSaving,
      canSave: Boolean(title.trim()),
      saveError: saveError ?? '',
      actionError,
      linkCopied,
      duplicatePending: duplicateMutation.isPending,
      deletePending: deleteMutation.isPending,
      onCopyLink,
      onDuplicate,
      onDelete,
    }),
    [
      isSaving,
      title,
      saveError,
      actionError,
      linkCopied,
      duplicateMutation.isPending,
      deleteMutation.isPending,
      onCopyLink,
      onDuplicate,
      onDelete,
    ],
  );

  return <VueIsland component={TaskDrawerActionsView} componentProps={viewProps} />;
}
