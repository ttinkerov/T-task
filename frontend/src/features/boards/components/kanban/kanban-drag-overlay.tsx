'use client';

import { useMemo } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import KanbanDragOverlayView from '@/vue/boards/KanbanDragOverlay.vue';
import type { BoardColumn, BoardTask } from '../../types';

export function KanbanDragOverlay({
  activeColumn,
  activeTask,
}: {
  activeColumn: BoardColumn | null;
  activeTask: BoardTask | null;
}) {
  const viewProps = useMemo(
    () => ({
      columnName: activeColumn?.name ?? '',
      taskTitle: activeTask?.title ?? '',
    }),
    [activeColumn?.name, activeTask?.title],
  );

  if (!activeColumn && !activeTask) return null;

  return <VueIsland component={KanbanDragOverlayView} componentProps={viewProps} />;
}
