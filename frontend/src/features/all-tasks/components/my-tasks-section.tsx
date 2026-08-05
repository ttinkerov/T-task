'use client';

import { useMemo } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import { PRIORITY_LABELS } from '@/features/boards/types';
import MyTasksSectionView from '@/vue/all-tasks/MyTasksSection.vue';
import type { AllTask } from '../types';

export function MyTasksSection({
  id,
  title,
  hint,
  tasks,
  tone,
  emptyLabel,
  count,
  onOpenTask,
}: {
  id: string;
  title: string;
  hint: string;
  tasks: AllTask[];
  tone?: 'danger' | 'warn';
  emptyLabel?: string;
  count?: number;
  onOpenTask: (taskId: string) => void;
}) {
  const sectionProps = useMemo(
    () => ({
      id,
      title,
      hint,
      tasks,
      tone: tone ?? '',
      emptyLabel: emptyLabel ?? '',
      count,
      priorityLabels: PRIORITY_LABELS,
      onOpenTask,
    }),
    [id, title, hint, tasks, tone, emptyLabel, count, onOpenTask],
  );

  return <VueIsland component={MyTasksSectionView} componentProps={sectionProps} />;
}
