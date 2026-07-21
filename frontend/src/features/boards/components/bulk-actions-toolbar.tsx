'use client';

import { PRIORITY_OPTIONS, type BoardColumn, type BulkUpdateTasksPayload } from '../types';
import { useBulkUpdateTasksMutation } from '../hooks';
import { useMembersQuery } from '@/features/workspaces/hooks';
import { useSprintsQuery } from '@/features/sprints';

export function BulkActionsToolbar({
  workspaceId,
  boardId,
  columns,
  selectedIds,
  onClear,
}: {
  workspaceId: string;
  boardId: string;
  columns: BoardColumn[];
  selectedIds: Set<string>;
  onClear: () => void;
}) {
  const { data: members = [] } = useMembersQuery(workspaceId);
  const { data: sprints = [] } = useSprintsQuery(workspaceId);
  const bulkMutation = useBulkUpdateTasksMutation(workspaceId, boardId);
  const count = selectedIds.size;

  if (count === 0) return null;

  const apply = async (patch: Omit<BulkUpdateTasksPayload, 'taskIds'>) => {
    try {
      await bulkMutation.mutateAsync({
        taskIds: [...selectedIds],
        ...patch,
      });
      onClear();
    } catch {
      // error shown below
    }
  };

  return (
    <div className="bulk-actions-toolbar" role="toolbar" aria-label="Массовые действия">
      <strong aria-live="polite">{count} выбрано</strong>

      <select
        aria-label="Исполнитель"
        disabled={bulkMutation.isPending}
        defaultValue=""
        onChange={(event) => {
          const value = event.target.value;
          if (!value) return;
          void apply({ assigneeId: value === '__none__' ? null : value });
          event.target.value = '';
        }}
      >
        <option value="">Исполнитель…</option>
        <option value="__none__">Без исполнителя</option>
        {members.map((member) => (
          <option key={member.userId} value={member.userId}>
            {member.user.name}
          </option>
        ))}
      </select>

      <select
        aria-label="Приоритет"
        disabled={bulkMutation.isPending}
        defaultValue=""
        onChange={(event) => {
          const value = event.target.value;
          if (!value) return;
          void apply({
            priority: value === '__none__' ? null : (value as BulkUpdateTasksPayload['priority']),
          });
          event.target.value = '';
        }}
      >
        <option value="">Приоритет…</option>
        <option value="__none__">Без приоритета</option>
        {PRIORITY_OPTIONS.filter((option) => option.value).map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <select
        aria-label="Спринт"
        disabled={bulkMutation.isPending}
        defaultValue=""
        onChange={(event) => {
          const value = event.target.value;
          if (!value) return;
          void apply({ sprintId: value === '__none__' ? null : value });
          event.target.value = '';
        }}
      >
        <option value="">Спринт…</option>
        <option value="__none__">Без спринта</option>
        {sprints.map((sprint) => (
          <option key={sprint.id} value={sprint.id}>
            {sprint.name}
          </option>
        ))}
      </select>

      <select
        aria-label="Переместить в колонку"
        disabled={bulkMutation.isPending}
        defaultValue=""
        onChange={(event) => {
          const value = event.target.value;
          if (!value) return;
          void apply({ columnId: value });
          event.target.value = '';
        }}
      >
        <option value="">В колонку…</option>
        {columns.map((column) => (
          <option key={column.id} value={column.id}>
            {column.name}
          </option>
        ))}
      </select>

      <button
        type="button"
        className="btn-ghost"
        onClick={onClear}
        disabled={bulkMutation.isPending}
      >
        Сбросить
      </button>

      {bulkMutation.isError ? (
        <span className="bulk-actions-toolbar__error" role="alert">
          Не удалось применить изменения
        </span>
      ) : null}
    </div>
  );
}
