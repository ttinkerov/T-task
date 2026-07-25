'use client';

import type { BoardColumn, BoardTask } from '../../types';

export function KanbanDragOverlay({
  activeColumn,
  activeTask,
}: {
  activeColumn: BoardColumn | null;
  activeTask: BoardTask | null;
}) {
  return (
    <>
      {activeColumn ? (
        <div className="kanban-column kanban-column--overlay">
          <header className="kanban-column__header">
            <h3>{activeColumn.name}</h3>
          </header>
        </div>
      ) : null}
      {activeTask ? (
        <div className="kanban-task-card kanban-task-card--dragging kanban-task">
          <p className="kanban-task-card__title">{activeTask.title}</p>
        </div>
      ) : null}
    </>
  );
}
