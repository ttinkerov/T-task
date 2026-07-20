import type { BoardFilters } from '@/features/boards/types';

export type SavedFilterView = 'BOARD' | 'ALL_TASKS' | 'MY_TASKS';

export interface SavedFilter {
  id: string;
  view: SavedFilterView;
  name: string;
  filters: BoardFilters;
  isDefault: boolean;
  isShared: boolean;
  isPinned: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSavedFilterPayload {
  view: SavedFilterView;
  name: string;
  filters: BoardFilters;
  isDefault?: boolean;
  isShared?: boolean;
  isPinned?: boolean;
}

export interface UpdateSavedFilterPayload {
  name?: string;
  filters?: BoardFilters;
  isDefault?: boolean;
  isShared?: boolean;
  isPinned?: boolean;
}
