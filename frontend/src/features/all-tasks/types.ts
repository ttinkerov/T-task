import type { BoardTask, TaskPriority } from '@/features/boards/types';

export type AllTasksStatus = '' | 'OPEN' | 'COMPLETED';
export type AllTasksDueFilter = '' | 'OVERDUE' | 'UPCOMING' | 'NO_DUE';
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
  boards: AllTasksBoard[];
  tags: { id: string; name: string; color: string }[];
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
};
