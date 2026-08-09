'use client';

import { useMemo } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import TaskRecurrenceFieldsView from '@/vue/boards/TaskRecurrenceFields.vue';
import {
  RECURRENCE_ACTION_OPTIONS,
  RECURRENCE_RULE_OPTIONS,
  RECURRENCE_WEEKDAY_OPTIONS,
  type TaskRecurrenceAction,
  type TaskRecurrenceRule,
} from '../../types';

export function TaskRecurrenceFields({
  recurrenceRule,
  recurrenceAction,
  recurrenceWeekdays,
  onRecurrenceRuleChange,
  onRecurrenceActionChange,
  onRecurrenceWeekdaysChange,
}: {
  recurrenceRule: TaskRecurrenceRule;
  recurrenceAction: TaskRecurrenceAction;
  recurrenceWeekdays: number[];
  onRecurrenceRuleChange: (rule: TaskRecurrenceRule) => void;
  onRecurrenceActionChange: (action: TaskRecurrenceAction) => void;
  onRecurrenceWeekdaysChange: (days: number[]) => void;
}) {
  const viewProps = useMemo(
    () => ({
      recurrenceRule,
      recurrenceAction,
      recurrenceWeekdays,
      ruleOptions: RECURRENCE_RULE_OPTIONS,
      actionOptions: RECURRENCE_ACTION_OPTIONS,
      weekdayOptions: RECURRENCE_WEEKDAY_OPTIONS,
      onRecurrenceRuleChange,
      onRecurrenceActionChange,
      onRecurrenceWeekdaysChange,
    }),
    [
      recurrenceRule,
      recurrenceAction,
      recurrenceWeekdays,
      onRecurrenceRuleChange,
      onRecurrenceActionChange,
      onRecurrenceWeekdaysChange,
    ],
  );

  return <VueIsland component={TaskRecurrenceFieldsView} componentProps={viewProps} />;
}
