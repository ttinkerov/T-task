'use client';

import { useState } from 'react';
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

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(taskId);
    onClose();
  };

  const handleDuplicate = async () => {
    const copy = await duplicateMutation.mutateAsync(taskId);
    if (copy?.id) {
      onOpenTask(copy.id);
    }
  };

  const handleCopyLink = async () => {
    await copyTaskLink(taskId, linkSource);
    setLinkCopied(true);
    window.setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <>
      {saveError ? <p className="text-sm text-red-400">{saveError}</p> : null}

      <div className="task-drawer__actions">
        <button type="button" onClick={handleCopyLink} className="btn-ghost">
          {linkCopied ? 'Скопировано' : 'Ссылка'}
        </button>
        <button
          type="button"
          onClick={handleDuplicate}
          disabled={duplicateMutation.isPending}
          className="btn-ghost"
        >
          {duplicateMutation.isPending ? '…' : 'Дублировать'}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
          className="btn-ghost task-drawer__danger"
        >
          Удалить
        </button>
        <button type="submit" disabled={isSaving || !title.trim()} className="btn-primary">
          {isSaving ? '…' : 'Сохранить'}
        </button>
      </div>
    </>
  );
}
