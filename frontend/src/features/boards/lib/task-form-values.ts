import type { BoardTask, TaskPriority, TaskRecurrenceAction, TaskRecurrenceRule } from '../types';

export function toDateInputValue(iso: string | null) {
  if (!iso) return '';
  return iso.slice(0, 10);
}

export interface TaskFormValues {
  title: string;
  description: string;
  priority: TaskPriority | '';
  complexity: number | '';
  timeEstimateMinutes: number | '';
  actualMinutes: number | '';
  dueDate: string;
  assigneeId: string;
  sprintId: string;
  epicId: string;
  isEpic: boolean;
  recurrenceRule: TaskRecurrenceRule;
  recurrenceAction: TaskRecurrenceAction;
  recurrenceWeekdays: number[];
}

export function toFormValues(task: BoardTask): TaskFormValues {
  return {
    title: task.title,
    description: task.description ?? '',
    priority: task.priority ?? '',
    complexity: task.complexity ?? '',
    timeEstimateMinutes: task.timeEstimateMinutes ?? '',
    actualMinutes: task.actualMinutes ?? '',
    dueDate: toDateInputValue(task.dueDate),
    assigneeId: task.assigneeId ?? '',
    sprintId: task.sprintId ?? '',
    epicId: task.epicId ?? '',
    isEpic: Boolean(task.isEpic),
    recurrenceRule: task.recurrenceRule,
    recurrenceAction: task.recurrenceAction,
    recurrenceWeekdays: task.recurrenceWeekdays ?? [],
  };
}

export function buildTaskUpdatePayload(values: TaskFormValues, task: BoardTask) {
  return {
    title: values.title.trim(),
    description: values.description.trim() || null,
    priority: values.priority || null,
    complexity: values.complexity === '' ? null : Number(values.complexity),
    timeEstimateMinutes:
      values.timeEstimateMinutes === '' ? null : Number(values.timeEstimateMinutes),
    actualMinutes: values.actualMinutes === '' ? null : Number(values.actualMinutes),
    dueDate: values.dueDate ? new Date(`${values.dueDate}T12:00:00`).toISOString() : null,
    assigneeId: values.assigneeId || null,
    sprintId: values.sprintId || null,
    epicId: values.isEpic ? null : values.epicId || null,
    isEpic: values.isEpic,
    recurrenceRule: values.recurrenceRule,
    recurrenceAction: values.recurrenceAction,
    recurrenceWeekdays: values.recurrenceRule === 'WEEKLY' ? values.recurrenceWeekdays : [],
    recurrenceOriginColumnId:
      values.recurrenceRule === 'NONE' ? null : (task.recurrenceOriginColumnId ?? task.columnId),
  };
}
