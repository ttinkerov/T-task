'use client';

import { useCallback, useMemo } from 'react';
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
  const { data: tags = [] } = useTagsQuery(workspaceId);
  const setTagsMutation = useSetTaskTagsMutation(workspaceId, taskId, boardId);
  const selectedIds = useMemo(() => selected.map((tag) => tag.id), [selected]);

  const onToggle = useCallback(
    (tagId: string) => {
      const selectedSet = new Set(selectedIds);
      const next = selectedSet.has(tagId)
        ? selected.filter((tag) => tag.id !== tagId).map((tag) => tag.id)
        : [...selectedIds, tagId];
      setTagsMutation.mutate(next);
    },
    [selected, selectedIds, setTagsMutation],
  );

  const viewProps = useMemo(
    () => ({
      tags,
      selectedIds,
      isPending: setTagsMutation.isPending,
      onToggle,
    }),
    [tags, selectedIds, setTagsMutation.isPending, onToggle],
  );

  return <VueIsland component={TaskTagsSectionView} componentProps={viewProps} />;
}
