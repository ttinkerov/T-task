'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CustomFieldDefinition } from '@/features/custom-fields/types';
import type { BoardColumn, BoardTask } from '../../types';
import type { TaskSelectEvent } from './types';
import { KanbanColumn } from './kanban-column';

export function SortableKanbanColumn({
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
  onOpenTask,
  onCompleteTask,
}: {
  column: BoardColumn;
  allColumns: BoardColumn[];
  workspaceId: string;
  boardId: string;
  canDelete: boolean;
  canManageAutomations: boolean;
  cardFields: CustomFieldDefinition[];
  memberNames: Map<string, string>;
  selectedIds: Set<string>;
  selectionActive: boolean;
  onToggleSelect: (taskId: string, event: TaskSelectEvent) => void;
  onOpenTask: (taskId: string) => void;
  onCompleteTask: (task: BoardTask) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
    data: { type: 'column' as const },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <KanbanColumn
        column={column}
        allColumns={allColumns}
        workspaceId={workspaceId}
        boardId={boardId}
        canDelete={canDelete}
        canManageAutomations={canManageAutomations}
        cardFields={cardFields}
        memberNames={memberNames}
        selectedIds={selectedIds}
        selectionActive={selectionActive}
        onToggleSelect={onToggleSelect}
        dragHandleProps={{ ...attributes, ...listeners }}
        onOpenTask={onOpenTask}
        onCompleteTask={onCompleteTask}
      />
    </div>
  );
}
