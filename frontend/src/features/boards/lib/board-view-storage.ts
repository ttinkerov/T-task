import {
  calendarRangeFromStoredView,
  normalizeBoardViewMode,
  normalizeCalendarRange,
  type BoardViewMode,
  type CalendarRange,
} from './task-view-utils';

export function readStoredViewPrefs(workspaceId: string): {
  mode: BoardViewMode;
  calendarRange: CalendarRange;
} {
  try {
    const stored = window.localStorage.getItem(`ttask:view-mode:${workspaceId}`);
    const mode = normalizeBoardViewMode(stored) ?? 'BOARD';
    const storedRange = window.localStorage.getItem(`ttask:calendar-range:${workspaceId}`);
    const calendarRange =
      normalizeCalendarRange(storedRange) ?? calendarRangeFromStoredView(stored) ?? 'WEEK';
    return { mode, calendarRange };
  } catch (error) {
    console.warn('Unable to read the saved board view mode', error);
    return { mode: 'BOARD', calendarRange: 'WEEK' };
  }
}

export function storeViewMode(workspaceId: string, mode: BoardViewMode) {
  try {
    window.localStorage.setItem(`ttask:view-mode:${workspaceId}`, mode);
  } catch (error) {
    console.warn('Unable to save the board view mode', error);
  }
}

export function storeCalendarRange(workspaceId: string, range: CalendarRange) {
  try {
    window.localStorage.setItem(`ttask:calendar-range:${workspaceId}`, range);
  } catch (error) {
    console.warn('Unable to save the calendar range', error);
  }
}
