'use client';

import { useMemo } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import TaskDrawerTitleFieldView from '@/vue/boards/TaskDrawerTitleField.vue';

export function TaskDrawerTitleField({
  title,
  onTitleChange,
}: {
  title: string;
  onTitleChange: (value: string) => void;
}) {
  const viewProps = useMemo(
    () => ({
      title,
      onTitleChange,
    }),
    [title, onTitleChange],
  );

  return <VueIsland component={TaskDrawerTitleFieldView} componentProps={viewProps} />;
}
