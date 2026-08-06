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

  const onDelete = useCallback(async () => {
    await deleteMutation.mutateAsync(taskId);
    onClose();
  }, [deleteMutation, taskId, onClose]);

  const onDuplicate = useCallback(async () => {
    const copy = await duplicateMutation.mutateAsync(taskId);
    if (copy?.id) {
      onOpenTask(copy.id);
    }
  }, [duplicateMutation, taskId, onOpenTask]);

  const onCopyLink = useCallback(async () => {
    await copyTaskLink(taskId, linkSource);
    setLinkCopied(true);
    window.setTimeout(() => setLinkCopied(false), 2000);
  }, [taskId, linkSource]);

  const viewProps = useMemo(
    () => ({
      isSaving,
      canSave: Boolean(title.trim()),
      saveError: saveError ?? '',
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
