'use client';

import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { AllTask } from '@/features/all-tasks';
import { stickyColorForTask, stickyTiltForTask } from '../lib/epic-sticky-lanes';

export function EpicStickyNote({
  task,
  onOpen,
}: {
  task: AllTask;
  onOpen: (taskId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { type: 'sticky', columnId: task.columnId },
  });

  const style = {
    transform: [
      CSS.Translate.toString(transform),
      isDragging ? null : `rotate(${stickyTiltForTask(task.id)}deg)`,
    ]
      .filter(Boolean)
      .join(' '),
    background: stickyColorForTask(task.id),
    opacity: isDragging ? 0.85 : 1,
    zIndex: isDragging ? 20 : 1,
  };

  return (
    <button
      ref={setNodeRef}
      type="button"
      className={`epic-sticky${isDragging ? ' epic-sticky--dragging' : ''}`}
      style={style}
      onClick={() => onOpen(task.id)}
      {...listeners}
      {...attributes}
    >
      <span className="epic-sticky__title">{task.title}</span>
      {task.assignee ? (
        <span className="epic-sticky__meta">{task.assignee.name.split(' ')[0]}</span>
      ) : null}
    </button>
  );
}

export function EpicStickyColumn({
  columnId,
  name,
  tasks,
  onOpenTask,
}: {
  columnId: string;
  name: string;
  tasks: AllTask[];
  onOpenTask: (taskId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: columnId, data: { type: 'column' } });

  return (
    <section
      ref={setNodeRef}
      className={`epic-sticky-column${isOver ? ' epic-sticky-column--over' : ''}`}
      data-testid={`epic-column-${columnId}`}
    >
      <header className="epic-sticky-column__header">
        <h3>{name}</h3>
        <span>{tasks.length}</span>
      </header>
      <div className="epic-sticky-column__notes">
        {tasks.map((task) => (
          <EpicStickyNote key={task.id} task={task} onOpen={onOpenTask} />
        ))}
      </div>
    </section>
  );
}
