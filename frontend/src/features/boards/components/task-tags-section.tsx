'use client';

import { useCallback, useMemo, useState } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import type { TaskTag } from '@/features/boards/types';
import { useSetTaskTagsMutation, useTagsQuery } from '@/features/tags/hooks';
import TaskTagsSectionView from '@/vue/boards/TaskTagsSection.vue';

export function TaskTagsSection({
  workspaceId,
  taskId,
  boardId,
  selected,
}: {
  workspaceId: string;
  taskId: string;
  boardId?: string | null;
  selected: TaskTag[];
}) {
  const { data: tags = [], isError, error, refetch } = useTagsQuery(workspaceId);
  const setTagsMutation = useSetTaskTagsMutation(workspaceId, taskId, boardId);
  const selectedIds = useMemo(() => selected.map((tag) => tag.id), [selected]);
  const [actionError, setActionError] = useState('');

  const onToggle = useCallback(
    async (tagId: string) => {
      const selectedSet = new Set(selectedIds);
      const next = selectedSet.has(tagId)
        ? selected.filter((tag) => tag.id !== tagId).map((tag) => tag.id)
        : [...selectedIds, tagId];
      setActionError('');
      try {
        await setTagsMutation.mutateAsync(next);
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Не удалось обновить теги');
      }
    },
    [selected, selectedIds, setTagsMutation],
  );

  const viewProps = useMemo(
    () => ({
      tags,
      selectedIds,
      isPending: setTagsMutation.isPending,
      loadError: isError
        ? error instanceof Error
          ? error.message
          : 'Не удалось загрузить теги'
        : '',
      actionError,
      onToggle,
      onRetry: () => {
        void refetch();
      },
    }),
    [tags, selectedIds, setTagsMutation.isPending, isError, error, actionError, onToggle, refetch],
  );

  return <VueIsland component={TaskTagsSectionView} componentProps={viewProps} />;
}
