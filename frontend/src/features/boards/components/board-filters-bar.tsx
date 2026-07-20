'use client';

import { SavedFiltersControl } from '@/features/saved-filters';
import { useSprintsQuery } from '@/features/sprints';
import { useTagsQuery } from '@/features/tags/hooks';
import { useMembersQuery } from '@/features/workspaces/hooks';
import { useMemo } from 'react';
import { useBoardQuery } from '../hooks';
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
  const { data: tags = [] } = useTagsQuery(workspaceId);
  const { data: sprints = [] } = useSprintsQuery(workspaceId);
  const { data: board } = useBoardQuery(workspaceId);
  const activeSprint = sprints.find((sprint) => sprint.active);
  const epics = useMemo(() => {
    if (!board) return [];
    return board.columns.flatMap((column) => column.tasks).filter((task) => task.isEpic);
  }, [board]);

  const hasActiveFilters =
    Boolean(filters.search) ||
    Boolean(filters.priority) ||
    Boolean(filters.assigneeId) ||
    Boolean(filters.tagId) ||
    filters.myTasksOnly ||
    Boolean(filters.overdueStatus) ||
    Boolean(filters.sprintId) ||
    Boolean(filters.epicId);

  return (
    <div className="board-filters">
      <SavedFiltersControl
        workspaceId={workspaceId}
        view="BOARD"
        filters={filters}
        onApply={onChange}
      />

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
        value={filters.tagId}
        onChange={(event) => onChange({ ...filters, tagId: event.target.value })}
        className="board-filters__select"
        aria-label="Фильтр по тегу"
      >
        <option value="">Все теги</option>
        {tags.map((tag) => (
          <option key={tag.id} value={tag.id}>
            {tag.name}
          </option>
        ))}
      </select>

      <select
        value={filters.sprintId}
        onChange={(event) => onChange({ ...filters, sprintId: event.target.value })}
        className="board-filters__select"
        aria-label="Фильтр по спринту"
      >
        <option value="">Все спринты</option>
        {sprints.map((sprint) => (
          <option key={sprint.id} value={sprint.id}>
            {sprint.name}
            {sprint.active ? ' · активный' : ''}
          </option>
        ))}
      </select>

      <select
        value={filters.epicId}
        onChange={(event) => onChange({ ...filters, epicId: event.target.value })}
        className="board-filters__select"
        aria-label="Фильтр по эпику"
      >
        <option value="">Все эпики</option>
        {epics.map((epic) => (
          <option key={epic.id} value={epic.id}>
            {epic.title}
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

      {activeSprint ? (
        <button
          type="button"
          className={`board-filters__chip ${filters.sprintId === activeSprint.id ? 'board-filters__chip--active' : ''}`}
          onClick={() =>
            onChange({
              ...filters,
              sprintId: filters.sprintId === activeSprint.id ? '' : activeSprint.id,
            })
          }
        >
          Этот спринт
        </button>
      ) : null}

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
