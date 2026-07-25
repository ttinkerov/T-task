'use client';

import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useMemo } from 'react';
import type { CustomFieldDefinition } from '@/features/custom-fields/types';
import { VirtualizedColumnList } from '@/shared/ui/virtualized-column-list';
import { useLoadMoreColumnTasksMutation } from '../../hooks';
import type { BoardColumn, BoardTask } from '../../types';
import type { TaskSelectEvent } from './types';
import { KanbanTaskCard } from './kanban-task-card';

export function KanbanColumnTaskList({
  column,
  allColumns,
  workspaceId,
  boardId,
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
  cardFields: CustomFieldDefinition[];
  memberNames: Map<string, string>;
  selectedIds: Set<string>;
  selectionActive: boolean;
  onToggleSelect: (taskId: string, event: TaskSelectEvent) => void;
  onOpenTask: (taskId: string) => void;
  onCompleteTask: (task: BoardTask) => void;
}) {
  const loadMoreMutation = useLoadMoreColumnTasksMutation(workspaceId, boardId);
  const taskIds = useMemo(() => column.tasks.map((task) => task.id), [column.tasks]);
  const remainingServer = Math.max(
    0,
    (column.taskTotal ?? column.tasks.length) - column.tasks.length,
  );

  return (
    <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
      <VirtualizedColumnList
        items={column.tasks}
        getItemKey={(task) => task.id}
        footer={
          column.truncated ? (
            <button
              type="button"
              className="kanban-column__show-more"
              disabled={loadMoreMutation.isPending}
              onClick={() => {
                void loadMoreMutation.mutateAsync({
                  columnId: column.id,
                  offset: column.tasks.length,
                });
              }}
            >
              {loadMoreMutation.isPending ? 'Загрузка…' : `Загрузить ещё (${remainingServer})`}
            </button>
          ) : null
        }
      >
        {(task) => (
          <KanbanTaskCard
            task={task}
            column={column}
            allColumns={allColumns}
            cardFields={cardFields}
            memberNames={memberNames}
            selected={selectedIds.has(task.id)}
            selectionActive={selectionActive}
            onToggleSelect={onToggleSelect}
            onOpenTask={onOpenTask}
            onCompleteTask={onCompleteTask}
          />
        )}
      </VirtualizedColumnList>
    </SortableContext>
  );
}
