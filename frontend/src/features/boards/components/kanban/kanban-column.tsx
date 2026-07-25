'use client';

import { useDroppable } from '@dnd-kit/core';
import { useCallback, useRef, useState } from 'react';
import { ColumnAutomationDialog } from '../column-automation-dialog';
import type { KanbanColumnViewProps } from './types';
import { KanbanColumnAddTaskForm } from './kanban-column-add-task-form';
import { KanbanColumnHeader } from './kanban-column-header';
import { KanbanColumnTaskList } from './kanban-column-task-list';

export function KanbanColumn({
  column,
  allColumns,
  workspaceId,
  boardId,
  canDelete,
  canManageAutomations,
  cardFields,
  memberNames,
  selectedIds,
  selectionActive,
  onToggleSelect,
  dragHandleProps,
  onOpenTask,
  onCompleteTask,
}: KanbanColumnViewProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const [automationOpen, setAutomationOpen] = useState(false);
  const automationBtnRef = useRef<HTMLButtonElement>(null);
  const handleAutomationClose = useCallback(() => {
    setAutomationOpen(false);
    automationBtnRef.current?.focus();
  }, []);

  const overWip =
    typeof column.wipLimit === 'number' &&
    column.wipLimit > 0 &&
    column.tasks.length > column.wipLimit;

  return (
    <div
      ref={setNodeRef}
      className={`kanban-column ${isOver ? 'kanban-column--over' : ''} ${overWip ? 'kanban-column--over-wip' : ''}`}
      data-testid={`kanban-column-${column.id}`}
      data-column-id={column.id}
    >
      <KanbanColumnHeader
        column={column}
        workspaceId={workspaceId}
        boardId={boardId}
        canDelete={canDelete}
        canManageAutomations={canManageAutomations}
        overWip={overWip}
        dragHandleProps={dragHandleProps}
        automationBtnRef={automationBtnRef}
        onOpenAutomation={() => setAutomationOpen(true)}
      />

      <KanbanColumnTaskList
        column={column}
        allColumns={allColumns}
        workspaceId={workspaceId}
        boardId={boardId}
        cardFields={cardFields}
        memberNames={memberNames}
        selectedIds={selectedIds}
        selectionActive={selectionActive}
        onToggleSelect={onToggleSelect}
        onOpenTask={onOpenTask}
        onCompleteTask={onCompleteTask}
      />

      <KanbanColumnAddTaskForm workspaceId={workspaceId} boardId={boardId} columnId={column.id} />

      {automationOpen ? (
        <ColumnAutomationDialog
          workspaceId={workspaceId}
          boardId={boardId}
          column={column}
          onClose={handleAutomationClose}
        />
      ) : null}
    </div>
  );
}
