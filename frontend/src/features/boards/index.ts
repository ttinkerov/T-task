export { KanbanBoard } from './components/kanban-board';
// BoardFiltersBar: import directly from './components/board-filters-bar' —
// do not re-export here (pulls Vue islands into every barrel consumer).
export { BoardWorkloadPanel } from './components/board-workload-panel';
// TaskDetailDrawer: import via dynamic() from './components/task-detail-drawer' —
// do not re-export here (pulls Vue islands into every barrel consumer).
export { TaskDisplayView, TaskViewToolbar } from './components/task-display-views';
export type { BoardViewMode, CalendarRange } from './lib/task-view-utils';
export {
  BOARD_VIEW_MODES,
  calendarRangeFromStoredView,
  normalizeBoardViewMode,
  normalizeCalendarRange,
} from './lib/task-view-utils';
export * from './hooks';
export * from './types';
