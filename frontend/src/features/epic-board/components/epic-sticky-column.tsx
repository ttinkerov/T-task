'use client';

import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useMemo } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import type { AllTask } from '@/features/all-tasks';
import EpicStickyColumnHeaderView from '@/vue/epic-board/EpicStickyColumnHeader.vue';
import EpicStickyNoteBodyView from '@/vue/epic-board/EpicStickyNoteBody.vue';
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

  const viewProps = useMemo(
    () => ({
      title: task.title,
      assigneeName: task.assignee?.name.split(' ')[0] ?? '',
    }),
    [task.title, task.assignee?.name],
  );

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
      <VueIsland component={EpicStickyNoteBodyView} componentProps={viewProps} displayContents />
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

  const headerProps = useMemo(
    () => ({
      name,
      count: tasks.length,
    }),
    [name, tasks.length],
  );

  return (
    <section
      ref={setNodeRef}
      className={`epic-sticky-column${isOver ? ' epic-sticky-column--over' : ''}`}
      data-testid={`epic-column-${columnId}`}
    >
      <VueIsland component={EpicStickyColumnHeaderView} componentProps={headerProps} />
      <div className="epic-sticky-column__notes">
        {tasks.map((task) => (
          <EpicStickyNote key={task.id} task={task} onOpen={onOpenTask} />
        ))}
      </div>
    </section>
  );
}
