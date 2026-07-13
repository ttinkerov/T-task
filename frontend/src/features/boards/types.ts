export type TeamSize = 'SOLO' | 'SMALL' | 'MEDIUM' | 'LARGE';

export type WorkspaceUseCase =
  'DEVELOPMENT' | 'DESIGN' | 'MARKETING' | 'PRODUCT' | 'OPERATIONS' | 'OTHER';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface BoardTask {
  id: string;
  title: string;
  description: string | null;
  priority: TaskPriority | null;
  complexity: number | null;
  dueDate: string | null;
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
  dueDate?: string | null;
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

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: 'Низкий',
  MEDIUM: 'Средний',
  HIGH: 'Высокий',
  URGENT: 'Срочный',
};
