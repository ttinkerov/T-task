'use client';

import { useMemo } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import TaskDrawerHeaderView from '@/vue/boards/TaskDrawerHeader.vue';

export function TaskDrawerHeader({
  columnName,
  onClose,
}: {
  columnName: string;
  onClose: () => void;
}) {
  const viewProps = useMemo(
    () => ({
      columnName,
      onClose,
    }),
    [columnName, onClose],
  );

  return <VueIsland component={TaskDrawerHeaderView} componentProps={viewProps} />;
}
