import type { BoardTask, TaskPriority } from '@/features/boards/types';

export type AllTasksStatus = '' | 'OPEN' | 'COMPLETED';
export type AllTasksDueFilter = '' | 'OVERDUE' | 'UPCOMING' | 'DUE_SOON' | 'NO_DUE';
export type AllTasksSort = 'CREATED_AT' | 'UPDATED_AT' | 'DUE_DATE' | 'PRIORITY' | 'TITLE';
export type SortOrder = 'ASC' | 'DESC';

export interface AllTasksFilters {
  search: string;
  priority: TaskPriority | '';
  assigneeId: string;
  boardId: string;
  columnId: string;
  tagId: string;
  status: AllTasksStatus;
  due: AllTasksDueFilter;
  watching: boolean;
}

export interface AllTasksQuery extends AllTasksFilters {
  page: number;
  limit: number;
  sortBy: AllTasksSort;
  sortOrder: SortOrder;
}

export interface AllTask extends BoardTask {
  board: { id: string; name: string };
  column: { id: string; name: string };
}

export interface AllTasksBoard {
  id: string;
  name: string;
  columns: { id: string; name: string }[];
}

export interface AllTasksResult {
  items: AllTask[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AllTasksFilterMeta {
  boards: AllTasksBoard[];
  tags: { id: string; name: string; color: string }[];
}

export interface MyTasksResult {
  overdue: AllTask[];
  dueSoon: AllTask[];
  assigned: AllTask[];
  watching: AllTask[];
  limit: number;
  dueSoonDays: number;
}

export const EMPTY_ALL_TASKS_FILTERS: AllTasksFilters = {
  search: '',
  priority: '',
  assigneeId: '',
  boardId: '',
  columnId: '',
  tagId: '',
  status: '',
  due: '',
  watching: false,
};
