'use client';

import { RefObject, useCallback, useMemo } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import KanbanColumnHeaderView from '@/vue/boards/KanbanColumnHeader.vue';
import { useDeleteColumnMutation, useUpdateColumnMutation } from '../../hooks';
import type { BoardColumn } from '../../types';

export function KanbanColumnHeader({
  column,
  workspaceId,
  boardId,
  canDelete,
  canManageAutomations,
  overWip,
  dragHandleProps,
  automationBtnRef,
  onOpenAutomation,
}: {
  column: BoardColumn;
  workspaceId: string;
  boardId: string;
  canDelete: boolean;
  canManageAutomations: boolean;
  overWip: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLElement>;
  automationBtnRef: RefObject<HTMLButtonElement | null>;
  onOpenAutomation: () => void;
}) {
  const updateColumnMutation = useUpdateColumnMutation(workspaceId, boardId);
  const deleteColumnMutation = useDeleteColumnMutation(workspaceId, boardId);

  const countLabel = column.wipLimit
    ? `${column.tasks.length}/${column.wipLimit}`
    : column.truncated && column.taskTotal
      ? `${column.tasks.length}/${column.taskTotal}`
      : String(column.tasks.length);

  const onRename = useCallback(
    async (raw: string) => {
      const next = raw.trim();
      if (!next || next === column.name) return;
      await updateColumnMutation.mutateAsync({ columnId: column.id, name: next });
    },
    [column.id, column.name, updateColumnMutation],
  );

  const onWipChange = useCallback(
    async (value: string) => {
      const trimmed = value.trim();
      const next = trimmed === '' ? null : Number(trimmed);
      if (next !== null && (!Number.isInteger(next) || next < 1)) return;
      if (next === (column.wipLimit ?? null)) return;
      await updateColumnMutation.mutateAsync({ columnId: column.id, wipLimit: next });
    },
    [column.id, column.wipLimit, updateColumnMutation],
  );

  const onDelete = useCallback(async () => {
    const message =
      column.tasks.length > 0
        ? `Удалить колонку «${column.name}» вместе с ${column.tasks.length} задачами?`
        : `Удалить колонку «${column.name}»?`;
    if (!window.confirm(message)) return;
    await deleteColumnMutation.mutateAsync(column.id);
  }, [column.id, column.name, column.tasks.length, deleteColumnMutation]);

  const viewProps = useMemo(
    () => ({
      name: column.name,
      countLabel,
      overWip,
      canManageAutomations,
      wipLimitValue: column.wipLimit ?? '',
      onRename,
      onWipChange,
    }),
    [
      column.name,
      column.wipLimit,
      countLabel,
      overWip,
      canManageAutomations,
      onRename,
      onWipChange,
    ],
  );

  return (
    <div className="kanban-column__header">
      <button
        type="button"
        className="kanban-column__drag"
        {...dragHandleProps}
        aria-label="Перетащить колонку"
      >
        ⠿
      </button>

      <VueIsland component={KanbanColumnHeaderView} componentProps={viewProps} displayContents />

      {canManageAutomations ? (
        <button
          ref={automationBtnRef}
          type="button"
          className={`kanban-column__automation ${
            column.automations.length > 0 ? 'kanban-column__automation--active' : ''
          }`}
          onClick={onOpenAutomation}
          aria-label={`Настроить автоматизацию колонки «${column.name}»`}
          title="Автоматизация"
        >
          ⚡
          {column.automations.length > 0 ? (
            <span aria-hidden="true">{column.automations.length}</span>
          ) : null}
        </button>
      ) : null}

      {canDelete ? (
        <button
          type="button"
          className="kanban-column__delete"
          onClick={() => void onDelete()}
          disabled={deleteColumnMutation.isPending}
          aria-label="Удалить колонку"
          title="Удалить колонку"
        >
          ×
        </button>
      ) : null}
    </div>
  );
}
