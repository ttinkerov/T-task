import { TaskRecurrenceRule } from '@prisma/client';

const ISO_WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const;

export function getIsoWeekday(date: Date): number {
  const day = date.getDay();
  return day === 0 ? 7 : day;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  result.setHours(12, 0, 0, 0);
  return result;
}

export function computeNextRecurrenceDate(
  from: Date,
  rule: TaskRecurrenceRule,
  weekdays: number[],
): Date {
  const base = new Date(from);
  base.setHours(12, 0, 0, 0);

  switch (rule) {
    case TaskRecurrenceRule.DAILY:
      return addDays(base, 1);
    case TaskRecurrenceRule.WEEKLY: {
      const allowed =
        weekdays.length > 0
          ? weekdays.filter((day) => ISO_WEEKDAYS.includes(day as (typeof ISO_WEEKDAYS)[number]))
          : [];

      if (allowed.length === 0) {
        return addDays(base, 7);
      }

      for (let offset = 1; offset <= 7; offset += 1) {
        const candidate = addDays(base, offset);
        if (allowed.includes(getIsoWeekday(candidate))) {
          return candidate;
        }
      }

      return addDays(base, 7);
    }
    case TaskRecurrenceRule.MONTHLY: {
      const next = new Date(base);
      next.setMonth(next.getMonth() + 1);
      return next;
    }
    case TaskRecurrenceRule.YEARLY: {
      const next = new Date(base);
      next.setFullYear(next.getFullYear() + 1);
      return next;
    }
    default:
      return base;
  }
}

export function isDoneColumn(
  column: { name: string; position: number },
  columns: { position: number }[],
): boolean {
  const maxPosition = Math.max(...columns.map((item) => item.position));
  const normalizedName = column.name.trim().toLowerCase();

  return (
    column.position === maxPosition ||
    normalizedName === 'готово' ||
    normalizedName === 'done' ||
    normalizedName === 'выполнено'
  );
}

export const RECURRENCE_RULE_LABELS: Record<TaskRecurrenceRule, string> = {
  [TaskRecurrenceRule.NONE]: 'Не повторяется',
  [TaskRecurrenceRule.DAILY]: 'Каждый день',
  [TaskRecurrenceRule.WEEKLY]: 'Каждую неделю',
  [TaskRecurrenceRule.MONTHLY]: 'Каждый месяц',
  [TaskRecurrenceRule.YEARLY]: 'Каждый год',
};
