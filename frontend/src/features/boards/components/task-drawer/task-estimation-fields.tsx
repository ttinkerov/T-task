'use client';

import { useMemo } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import TaskEstimationFieldsView from '@/vue/boards/TaskEstimationFields.vue';
import {
  COMPLEXITY_OPTIONS,
  PRIORITY_OPTIONS,
  TIME_ESTIMATE_OPTIONS,
  type TaskPriority,
} from '../../types';

export function TaskEstimationFields({
  priority,
  complexity,
  timeEstimateMinutes,
  actualMinutes,
  dueDate,
  onPriorityChange,
  onComplexityChange,
  onTimeEstimateChange,
  onActualMinutesChange,
  onDueDateChange,
}: {
  priority: TaskPriority | '';
  complexity: number | '';
  timeEstimateMinutes: number | '';
  actualMinutes: number | '';
  dueDate: string;
  onPriorityChange: (value: TaskPriority | '') => void;
  onComplexityChange: (value: number | '') => void;
  onTimeEstimateChange: (value: number | '') => void;
  onActualMinutesChange: (value: number | '') => void;
  onDueDateChange: (value: string) => void;
}) {
  const viewProps = useMemo(
    () => ({
      priority,
      complexity,
      timeEstimateMinutes,
      actualMinutes,
      dueDate,
      priorityOptions: PRIORITY_OPTIONS,
      complexityOptions: COMPLEXITY_OPTIONS,
      timeEstimateOptions: TIME_ESTIMATE_OPTIONS,
      onPriorityChange,
      onComplexityChange,
      onTimeEstimateChange,
      onActualMinutesChange,
      onDueDateChange,
    }),
    [
      priority,
      complexity,
      timeEstimateMinutes,
      actualMinutes,
      dueDate,
      onPriorityChange,
      onComplexityChange,
      onTimeEstimateChange,
      onActualMinutesChange,
      onDueDateChange,
    ],
  );

  return <VueIsland component={TaskEstimationFieldsView} componentProps={viewProps} />;
}
