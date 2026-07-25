'use client';

import { RefObject, useState } from 'react';
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
  const [editingName, setEditingName] = useState(false);
  const [columnName, setColumnName] = useState(column.name);

  const handleRename = async () => {
    const next = columnName.trim();
    if (!next || next === column.name) {
      setColumnName(column.name);
      setEditingName(false);
      return;
    }
    await updateColumnMutation.mutateAsync({ columnId: column.id, name: next });
    setEditingName(false);
  };

  const handleWipBlur = async (value: string) => {
    const trimmed = value.trim();
    const next = trimmed === '' ? null : Number(trimmed);
    if (next !== null && (!Number.isInteger(next) || next < 1)) return;
    if (next === (column.wipLimit ?? null)) return;
    await updateColumnMutation.mutateAsync({ columnId: column.id, wipLimit: next });
  };

  const handleDelete = async () => {
    const message =
      column.tasks.length > 0
        ? `Удалить колонку «${column.name}» вместе с ${column.tasks.length} задачами?`
        : `Удалить колонку «${column.name}»?`;
    if (!window.confirm(message)) return;
    await deleteColumnMutation.mutateAsync(column.id);
  };

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

      {editingName ? (
        <input
          value={columnName}
          onChange={(event) => setColumnName(event.target.value)}
          onBlur={handleRename}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              void handleRename();
            }
            if (event.key === 'Escape') {
              setColumnName(column.name);
              setEditingName(false);
            }
          }}
          className="kanban-column__title-input"
          autoFocus
          maxLength={80}
        />
      ) : (
        <button
          type="button"
          className="kanban-column__title"
          onClick={() => {
            setColumnName(column.name);
            setEditingName(true);
          }}
          title="Переименовать"
        >
          {column.name}
        </button>
      )}

      <span className={`kanban-column__count ${overWip ? 'kanban-column__count--over' : ''}`}>
        {column.wipLimit
          ? `${column.tasks.length}/${column.wipLimit}`
          : column.truncated && column.taskTotal
            ? `${column.tasks.length}/${column.taskTotal}`
            : column.tasks.length}
      </span>
      {canManageAutomations ? (
        <input
          type="number"
          min={1}
          max={999}
          className="kanban-column__wip-input"
          title="WIP-лимит"
          aria-label="WIP-лимит колонки"
          defaultValue={column.wipLimit ?? ''}
          placeholder="WIP"
          onBlur={(event) => void handleWipBlur(event.target.value)}
          onClick={(event) => event.stopPropagation()}
        />
      ) : null}

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
          onClick={handleDelete}
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
