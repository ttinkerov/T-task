export type TeamSize = 'SOLO' | 'SMALL' | 'MEDIUM' | 'LARGE';

export type WorkspaceUseCase =
  'DEVELOPMENT' | 'DESIGN' | 'MARKETING' | 'PRODUCT' | 'OPERATIONS' | 'OTHER';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface TaskAssignee {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

export interface BoardTask {
  id: string;
  title: string;
  description: string | null;
  priority: TaskPriority | null;
  complexity: number | null;
  timeEstimateMinutes: number | null;
  actualMinutes: number | null;
  dueDate: string | null;
  assigneeId: string | null;
  assignee: TaskAssignee | null;
  position: number;
  columnId: string;
  createdAt: string;
}

export interface BoardColumn {
  id: string;
  name: string;
  position: number;
  tasks: BoardTask[];
}

export interface BoardView {
  id: string;
  workspaceId: string;
  name: string;
  columns: BoardColumn[];
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string | null;
  priority?: TaskPriority | null;
  complexity?: number | null;
  timeEstimateMinutes?: number | null;
  actualMinutes?: number | null;
  dueDate?: string | null;
  assigneeId?: string | null;
}

export interface TaskComment {
  id: string;
  body: string;
  authorId: string;
  author: TaskAssignee;
  createdAt: string;
}

export interface BoardFilters {
  search: string;
  priority: TaskPriority | '';
  assigneeId: string | '';
  myTasksOnly: boolean;
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
  { value: '', label: 'Не указана' },
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 5, label: '5' },
  { value: 8, label: '8' },
  { value: 13, label: '13' },
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
  myTasksOnly: false,
};
