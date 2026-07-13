'use client';

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FormEvent, useState } from 'react';
import {
  useBoardQuery,
  useCreateColumnMutation,
  useCreateTaskMutation,
  useMoveColumnMutation,
  useMoveTaskMutation,
} from '../hooks';
import type { BoardColumn, BoardTask, BoardView } from '../types';
import { PRIORITY_LABELS } from '../types';
import { TaskDetailDrawer } from './task-detail-drawer';

type DragType = 'column' | 'task';

export function KanbanBoard({ workspaceId }: { workspaceId: string }) {
  const { data: board, isLoading } = useBoardQuery(workspaceId);
  const moveTaskMutation = useMoveTaskMutation(workspaceId);
  const moveColumnMutation = useMoveColumnMutation(workspaceId);
  const [activeTask, setActiveTask] = useState<BoardTask | null>(null);
  const [activeColumn, setActiveColumn] = useState<BoardColumn | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const type = event.active.data.current?.type as DragType | undefined;

    if (type === 'column') {
      const column = board?.columns.find((item) => item.id === String(event.active.id));
      setActiveColumn(column ?? null);
      setActiveTask(null);
      return;
    }

    setActiveColumn(null);
    setActiveTask(findTask(board, String(event.active.id)));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const type = event.active.data.current?.type as DragType | undefined;
    setActiveTask(null);
    setActiveColumn(null);

    const { active, over } = event;
    if (!over || !board) return;

    if (type === 'column') {
      const columnId = String(active.id);
      const overColumnId = String(over.id);
      if (columnId === overColumnId) return;

      const fromIndex = board.columns.findIndex((column) => column.id === columnId);
      const toIndex = board.columns.findIndex((column) => column.id === overColumnId);
      if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return;

      await moveColumnMutation.mutateAsync({ columnId, position: toIndex });
      return;
    }

    const taskId = String(active.id);
    const destination = resolveDropTarget(board, String(over.id), taskId);
    if (!destination) return;

    const task = findTask(board, taskId);
    if (!task) return;

    if (task.columnId === destination.columnId && task.position === destination.position) {
      return;
    }

    await moveTaskMutation.mutateAsync({
      taskId,
      columnId: destination.columnId,
      position: destination.position,
    });
  };

  if (isLoading || !board) {
    return <p className="text-sm text-muted-foreground">Загрузка доски...</p>;
  }

  const columnIds = board.columns.map((column) => column.id);
  const selectedTask = selectedTaskId ? findTask(board, selectedTaskId) : null;
  const selectedColumnName = selectedTask
    ? (board.columns.find((column) => column.id === selectedTask.columnId)?.name ?? '')
    : '';

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="kanban-board">
          <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
            {board.columns.map((column) => (
              <SortableKanbanColumn
                key={column.id}
                column={column}
                workspaceId={workspaceId}
                onOpenTask={setSelectedTaskId}
              />
            ))}
          </SortableContext>
          <AddColumnPanel workspaceId={workspaceId} />
        </div>

        <DragOverlay>
          {activeColumn ? (
            <div className="kanban-column kanban-column--dragging">
              <div className="kanban-column__header">
                <h3 className="kanban-column__title">{activeColumn.name}</h3>
                <span className="kanban-column__count">{activeColumn.tasks.length}</span>
              </div>
            </div>
          ) : null}
          {activeTask ? (
            <div className="kanban-task-card kanban-task-card--dragging">
              <p className="kanban-task-card__title">{activeTask.title}</p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {selectedTask ? (
        <TaskDetailDrawer
          workspaceId={workspaceId}
          task={selectedTask}
          columnName={selectedColumnName}
          onClose={() => setSelectedTaskId(null)}
        />
      ) : null}
    </>
  );
}

function AddColumnPanel({ workspaceId }: { workspaceId: string }) {
  const createColumnMutation = useCreateColumnMutation(workspaceId);
  const [name, setName] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return;
    await createColumnMutation.mutateAsync(name.trim());
    setName('');
  };

  return (
    <form onSubmit={handleSubmit} className="kanban-add-column">
      <span className="kanban-add-column__label">Новая колонка</span>
      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Название колонки"
        maxLength={80}
        className="kanban-add-column__input"
      />
      <button
        type="submit"
        disabled={!name.trim() || createColumnMutation.isPending}
        className="kanban-add-column__btn"
      >
        {createColumnMutation.isPending ? 'Добавление...' : '+ Добавить колонку'}
      </button>
    </form>
  );
}

function SortableKanbanColumn({
  column,
  workspaceId,
  onOpenTask,
}: {
  column: BoardColumn;
  workspaceId: string;
  onOpenTask: (taskId: string) => void;
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
        workspaceId={workspaceId}
        dragHandleProps={{ ...attributes, ...listeners }}
        onOpenTask={onOpenTask}
      />
    </div>
  );
}

function KanbanColumn({
  column,
  workspaceId,
  dragHandleProps,
  onOpenTask,
}: {
  column: BoardColumn;
  workspaceId: string;
  dragHandleProps?: React.HTMLAttributes<HTMLElement>;
  onOpenTask: (taskId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const createMutation = useCreateTaskMutation(workspaceId);
  const [title, setTitle] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) return;
    await createMutation.mutateAsync({ title: title.trim(), columnId: column.id });
    setTitle('');
  };

  return (
    <div ref={setNodeRef} className={`kanban-column ${isOver ? 'kanban-column--over' : ''}`}>
      <div className="kanban-column__header">
        <button
          type="button"
          className="kanban-column__drag"
          {...dragHandleProps}
          aria-label="Перетащить колонку"
        >
          ⠿
        </button>
        <h3 className="kanban-column__title">{column.name}</h3>
        <span className="kanban-column__count">{column.tasks.length}</span>
      </div>

      <SortableContext
        items={column.tasks.map((task) => task.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="kanban-column__tasks">
          {column.tasks.map((task) => (
            <KanbanTaskCard key={task.id} task={task} onOpen={() => onOpenTask(task.id)} />
          ))}
        </div>
      </SortableContext>

      <form onSubmit={handleSubmit} className="kanban-column__add">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Задача..."
          className="kanban-column__add-input"
        />
        <button
          type="submit"
          disabled={createMutation.isPending || !title.trim()}
          className="kanban-column__add-btn"
          aria-label="Добавить задачу"
        >
          +
        </button>
      </form>
    </div>
  );
}

function KanbanTaskCard({ task, onOpen }: { task: BoardTask; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task' as const, columnId: task.columnId },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const dueLabel = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
    : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="kanban-task-card"
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="kanban-task-card__body">
        <button
          type="button"
          className="kanban-task-card__drag"
          {...attributes}
          {...listeners}
          onClick={(event) => event.stopPropagation()}
          aria-label="Перетащить задачу"
        >
          ⠿
        </button>
        <div className="min-w-0 flex-1">
          <p className="kanban-task-card__title">{task.title}</p>
          {task.description ? <p className="kanban-task-card__desc">{task.description}</p> : null}
          {(task.priority || task.complexity || dueLabel) && (
            <div className="kanban-task-meta">
              {task.priority ? (
                <span className={`kanban-task-chip kanban-task-chip--priority-${task.priority}`}>
                  {PRIORITY_LABELS[task.priority]}
                </span>
              ) : null}
              {task.complexity ? (
                <span className="kanban-task-chip">{task.complexity} SP</span>
              ) : null}
              {dueLabel ? <span className="kanban-task-chip">{dueLabel}</span> : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function findTask(board: BoardView | null | undefined, taskId: string) {
  if (!board) return null;
  for (const column of board.columns) {
    const task = column.tasks.find((item) => item.id === taskId);
    if (task) return task;
  }
  return null;
}

function resolveDropTarget(board: BoardView, overId: string, taskId: string) {
  const columnMatch = board.columns.find((column) => column.id === overId);
  if (columnMatch) {
    const activeTask = findTask(board, taskId);
    if (activeTask?.columnId === columnMatch.id) {
      return { columnId: columnMatch.id, position: Math.max(0, columnMatch.tasks.length - 1) };
    }
    return { columnId: columnMatch.id, position: columnMatch.tasks.length };
  }

  const overTask = findTask(board, overId);
  if (!overTask) return null;

  const column = board.columns.find((item) => item.id === overTask.columnId);
  if (!column) return null;

  const overIndex = column.tasks.findIndex((item) => item.id === overId);
  const activeTask = findTask(board, taskId);
  if (!activeTask) return null;

  if (activeTask.columnId === column.id && overIndex > activeTask.position) {
    return { columnId: column.id, position: overIndex };
  }

  return { columnId: column.id, position: overIndex };
}
