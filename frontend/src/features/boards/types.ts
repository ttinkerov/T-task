import type { DescriptionDoc } from '@/features/task-description';

export type TeamSize = 'SOLO' | 'SMALL' | 'MEDIUM' | 'LARGE';

export type WorkspaceUseCase =
  'DEVELOPMENT' | 'DESIGN' | 'MARKETING' | 'PRODUCT' | 'OPERATIONS' | 'OTHER';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type TaskRecurrenceRule = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export type TaskRecurrenceAction = 'DUPLICATE' | 'RESCHEDULE';
export type ColumnAutomationAction = 'ASSIGN_USER' | 'START_TIMER' | 'COMPLETE_TASK';
export type TaskRelationType = 'BLOCKS' | 'WAITING_FOR' | 'RELATES_TO';

export interface TaskAssignee {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

export interface TaskCustomFieldValue {
  fieldId: string;
  value: string | number | boolean | string[] | null;
}

export interface TaskTag {
  id: string;
  name: string;
  color: string;
}

export interface TaskSubtask {
  id: string;
  title: string;
  completed: boolean;
  position: number;
}

export interface BoardTask {
  id: string;
  title: string;
  description: string | null;
  descriptionDoc?: DescriptionDoc | null;
  priority: TaskPriority | null;
  complexity: number | null;
  timeEstimateMinutes: number | null;
  actualMinutes: number | null;
  dueDate: string | null;
  assigneeId: string | null;
  assignee: TaskAssignee | null;
  position: number;
  columnId: string;
  recurrenceRule: TaskRecurrenceRule;
  recurrenceAction: TaskRecurrenceAction;
  recurrenceWeekdays: number[];
  recurrenceOriginColumnId: string | null;
  overdueDays: number;
  timerStartedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  customFields: TaskCustomFieldValue[];
  tags: TaskTag[];
  subtasks: TaskSubtask[];
  sprintId: string | null;
  isEpic: boolean;
  epicId: string | null;
}

export interface ColumnAutomation {
  id: string;
  action: ColumnAutomationAction;
  assigneeId: string | null;
  assignee: TaskAssignee | null;
}

export interface BoardColumn {
  id: string;
  name: string;
  position: number;
  wipLimit: number | null;
  automations: ColumnAutomation[];
  tasks: BoardTask[];
}

export interface UpdateColumnAutomationsPayload {
  assignUserId: string | null;
  startTimer: boolean;
  completeTask: boolean;
}

export interface BoardView {
  id: string;
  workspaceId: string;
  name: string;
  columns: BoardColumn[];
}

export interface BoardSummary {
  id: string;
  workspaceId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string | null;
  descriptionDoc?: DescriptionDoc | null;
  priority?: TaskPriority | null;
  complexity?: number | null;
  timeEstimateMinutes?: number | null;
  actualMinutes?: number | null;
  dueDate?: string | null;
  assigneeId?: string | null;
  recurrenceRule?: TaskRecurrenceRule;
  recurrenceAction?: TaskRecurrenceAction;
  recurrenceWeekdays?: number[];
  recurrenceOriginColumnId?: string | null;
  sprintId?: string | null;
  isEpic?: boolean;
  epicId?: string | null;
}

export interface BulkUpdateTasksPayload {
  taskIds: string[];
  assigneeId?: string | null;
  priority?: TaskPriority | null;
  sprintId?: string | null;
  columnId?: string;
}

export interface BulkUpdateTasksResult {
  updated: number;
  taskIds: string[];
}

export interface TaskComment {
  id: string;
  body: string;
  authorId: string;
  author: TaskAssignee;
  createdAt: string;
}

export interface TaskRelation {
  id: string;
  type: TaskRelationType;
  task: {
    id: string;
    title: string;
    columnId: string;
    columnName: string;
    completed: boolean;
    dueDate: string | null;
  };
}

export interface TaskRelationCandidate {
  id: string;
  title: string;
  columnName: string;
  completed: boolean;
  isEpic?: boolean;
}

export interface BoardFilters {
  search: string;
  priority: TaskPriority | '';
  assigneeId: string | '';
  tagId: string | '';
  myTasksOnly: boolean;
  overdueStatus: '' | 'overdue' | 'not_overdue';
  sprintId: string | '';
  epicId: string | '';
}

export const TEAM_SIZE_OPTIONS: { value: TeamSize; label: string }[] = [
  { value: 'SOLO', label: 'Только я' },
  { value: 'SMALL', label: '2–10 человек' },
  { value: 'MEDIUM', label: '11–50 человек' },
  { value: 'LARGE', label: '50+ человек' },
];

export const USE_CASE_OPTIONS: { value: WorkspaceUseCase; label: string }[] = [
  { value: 'DEVELOPMENT', label: 'Разработка' },
  { value: 'DESIGN', label: 'Дизайн' },
  { value: 'MARKETING', label: 'Маркетинг' },
  { value: 'PRODUCT', label: 'Продукт' },
  { value: 'OPERATIONS', label: 'Операции' },
  { value: 'OTHER', label: 'Другое' },
];

export const PRIORITY_OPTIONS: { value: TaskPriority | ''; label: string }[] = [
  { value: '', label: 'Без приоритета' },
  { value: 'LOW', label: 'Низкий' },
  { value: 'MEDIUM', label: 'Средний' },
  { value: 'HIGH', label: 'Высокий' },
  { value: 'URGENT', label: 'Срочный' },
];

export const COMPLEXITY_OPTIONS: { value: number | ''; label: string }[] = [
  { value: '', label: 'Не указаны' },
  { value: 1, label: '1 SP' },
  { value: 2, label: '2 SP' },
  { value: 3, label: '3 SP' },
  { value: 5, label: '5 SP' },
  { value: 8, label: '8 SP' },
  { value: 13, label: '13 SP' },
];

export const TIME_ESTIMATE_OPTIONS: { value: number | ''; label: string }[] = [
  { value: '', label: 'Не указана' },
  { value: 15, label: '15 мин' },
  { value: 30, label: '30 мин' },
  { value: 60, label: '1 ч' },
  { value: 120, label: '2 ч' },
  { value: 240, label: '4 ч' },
  { value: 480, label: '8 ч' },
];

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: 'Низкий',
  MEDIUM: 'Средний',
  HIGH: 'Высокий',
  URGENT: 'Срочный',
};

export const EMPTY_BOARD_FILTERS: BoardFilters = {
  search: '',
  priority: '',
  assigneeId: '',
  tagId: '',
  myTasksOnly: false,
  overdueStatus: '',
  sprintId: '',
  epicId: '',
};

export const OVERDUE_FILTER_OPTIONS: {
  value: BoardFilters['overdueStatus'];
  label: string;
}[] = [
  { value: '', label: 'Все задачи' },
  { value: 'overdue', label: 'Просроченные' },
  { value: 'not_overdue', label: 'Без просрочки' },
];

export const RECURRENCE_RULE_OPTIONS: { value: TaskRecurrenceRule; label: string }[] = [
  { value: 'NONE', label: 'Не повторяется' },
  { value: 'DAILY', label: 'Каждый день' },
  { value: 'WEEKLY', label: 'Каждую неделю' },
  { value: 'MONTHLY', label: 'Каждый месяц' },
  { value: 'YEARLY', label: 'Каждый год' },
];

export const RECURRENCE_ACTION_OPTIONS: { value: TaskRecurrenceAction; label: string }[] = [
  { value: 'DUPLICATE', label: 'Создать копию' },
  { value: 'RESCHEDULE', label: 'Перенести задачу' },
];

export const RECURRENCE_WEEKDAY_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: 'Пн' },
  { value: 2, label: 'Вт' },
  { value: 3, label: 'Ср' },
  { value: 4, label: 'Чт' },
  { value: 5, label: 'Пт' },
  { value: 6, label: 'Сб' },
  { value: 7, label: 'Вс' },
];

export const RECURRENCE_RULE_LABELS: Record<Exclude<TaskRecurrenceRule, 'NONE'>, string> = {
  DAILY: 'Каждый день',
  WEEKLY: 'Повтор',
  MONTHLY: 'Каждый месяц',
  YEARLY: 'Каждый год',
};
