'use client';

import { useMembersQuery } from '@/features/workspaces/hooks';
import {
  EMPTY_BOARD_FILTERS,
  OVERDUE_FILTER_OPTIONS,
  PRIORITY_OPTIONS,
  type BoardFilters,
  type TaskPriority,
} from '../types';

interface BoardFiltersBarProps {
  workspaceId: string;
  filters: BoardFilters;
  onChange: (filters: BoardFilters) => void;
}

export function BoardFiltersBar({ workspaceId, filters, onChange }: BoardFiltersBarProps) {
  const { data: members = [] } = useMembersQuery(workspaceId);
  const hasActiveFilters =
    Boolean(filters.search) ||
    Boolean(filters.priority) ||
    Boolean(filters.assigneeId) ||
    filters.myTasksOnly ||
    Boolean(filters.overdueStatus);

  return (
    <div className="board-filters">
      <input
        value={filters.search}
        onChange={(event) => onChange({ ...filters, search: event.target.value })}
        placeholder="Поиск задач..."
        className="board-filters__search"
      />

      <select
        value={filters.priority}
        onChange={(event) =>
          onChange({ ...filters, priority: event.target.value as TaskPriority | '' })
        }
        className="board-filters__select"
        aria-label="Фильтр по приоритету"
      >
        <option value="">Все приоритеты</option>
        {PRIORITY_OPTIONS.filter((option) => option.value).map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <select
        value={filters.assigneeId}
        onChange={(event) => onChange({ ...filters, assigneeId: event.target.value })}
        className="board-filters__select"
        aria-label="Фильтр по исполнителю"
      >
        <option value="">Все исполнители</option>
        {members.map((member) => (
          <option key={member.userId} value={member.userId}>
            {member.user.name}
          </option>
        ))}
      </select>

      <select
        value={filters.overdueStatus}
        onChange={(event) =>
          onChange({
            ...filters,
            overdueStatus: event.target.value as BoardFilters['overdueStatus'],
          })
        }
        className="board-filters__select"
        aria-label="Фильтр по просрочке"
      >
        {OVERDUE_FILTER_OPTIONS.map((option) => (
          <option key={option.label} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <button
        type="button"
        className={`board-filters__chip ${filters.myTasksOnly ? 'board-filters__chip--active' : ''}`}
        onClick={() => onChange({ ...filters, myTasksOnly: !filters.myTasksOnly })}
      >
        Мои задачи
      </button>

      {hasActiveFilters ? (
        <button
          type="button"
          className="board-filters__reset"
          onClick={() => onChange(EMPTY_BOARD_FILTERS)}
        >
          Сбросить
        </button>
      ) : null}
    </div>
  );
}
