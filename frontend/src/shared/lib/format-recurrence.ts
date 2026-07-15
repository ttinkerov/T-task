import type { TaskRecurrenceRule } from '@/features/boards/types';
import { RECURRENCE_RULE_LABELS } from '@/features/boards/types';

export function formatRecurrenceLabel(rule: TaskRecurrenceRule, weekdays: number[]): string | null {
  if (rule === 'NONE') {
    return null;
  }

  if (rule === 'WEEKLY' && weekdays.length > 0) {
    const labels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    const days = weekdays
      .slice()
      .sort((left, right) => left - right)
      .map((day) => labels[day - 1])
      .join(', ');
    return `Повтор: ${days}`;
  }

  return RECURRENCE_RULE_LABELS[rule];
}
