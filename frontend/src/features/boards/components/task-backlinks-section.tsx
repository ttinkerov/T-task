'use client';

import { useMemo } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import { useTaskBacklinksQuery } from '../hooks';
import type { TaskBacklink } from '../types';
import TaskBacklinksSectionView from '@/vue/boards/TaskBacklinksSection.vue';

const EMPTY_BACKLINKS: TaskBacklink[] = [];

export function TaskBacklinksSection({
  workspaceId,
  taskId,
  onOpenTask,
}: {
  workspaceId: string;
  taskId: string;
  onOpenTask: (taskId: string) => void;
}) {
  const backlinksQuery = useTaskBacklinksQuery(workspaceId, taskId);
  const backlinks = backlinksQuery.data ?? EMPTY_BACKLINKS;

  const viewProps = useMemo(
    () => ({
      backlinks,
      isLoading: backlinksQuery.isLoading,
      loadError: Boolean(backlinksQuery.error),
      onOpenTask,
    }),
    [backlinks, backlinksQuery.isLoading, backlinksQuery.error, onOpenTask],
  );

  if (!backlinksQuery.isLoading && !backlinksQuery.error && backlinks.length === 0) {
    return null;
  }

  return <VueIsland component={TaskBacklinksSectionView} componentProps={viewProps} />;
}
