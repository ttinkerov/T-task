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
  useDeleteTaskMutation,
  useMoveTaskMutation,
} from '../hooks';
import type { BoardColumn, BoardTask, BoardView } from '../types';

export function KanbanBoard({ workspaceId }: { workspaceId: string }) {
  const { data: board, isLoading } = useBoardQuery(workspaceId);
  const moveMutation = useMoveTaskMutation(workspaceId);
  const [activeTask, setActiveTask] = useState<BoardTask | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = findTask(board, String(event.active.id));
    setActiveTask(task);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);

    const { active, over } = event;
    if (!over || !board) return;

    const taskId = String(active.id);
    const destination = resolveDropTarget(board, String(over.id), taskId);
    if (!destination) return;

    const task = findTask(board, taskId);
    if (!task) return;

    if (task.columnId === destination.columnId && task.position === destination.position) {
      return;
    }

    await moveMutation.mutateAsync({
      taskId,
      columnId: destination.columnId,
      position: destination.position,
    });
  };

  if (isLoading || !board) {
    return <p className="text-sm text-muted-foreground">Загрузка доски...</p>;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="kanban-board">
        {board.columns.map((column) => (
          <KanbanColumn key={column.id} column={column} workspaceId={workspaceId} />
        ))}
        <AddColumnPanel workspaceId={workspaceId} />
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="kanban-task-card kanban-task-card--dragging">
            <p className="kanban-task-card__title">{activeTask.title}</p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
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

function KanbanColumn({ column, workspaceId }: { column: BoardColumn; workspaceId: string }) {
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
        <h3 className="kanban-column__title">{column.name}</h3>
        <span className="kanban-column__count">{column.tasks.length}</span>
      </div>

      <SortableContext
        items={column.tasks.map((task) => task.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="kanban-column__tasks">
          {column.tasks.map((task) => (
            <KanbanTaskCard key={task.id} task={task} workspaceId={workspaceId} />
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

function KanbanTaskCard({ task, workspaceId }: { task: BoardTask; workspaceId: string }) {
  const deleteMutation = useDeleteTaskMutation(workspaceId);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="kanban-task-card">
      <div className="kanban-task-card__body">
        <button
          type="button"
          className="kanban-task-card__drag"
          {...attributes}
          {...listeners}
          aria-label="Перетащить задачу"
        >
          ⠿
        </button>
        <div className="min-w-0 flex-1">
          <p className="kanban-task-card__title">{task.title}</p>
          {task.description ? <p className="kanban-task-card__desc">{task.description}</p> : null}
        </div>
        <button
          type="button"
          onClick={() => deleteMutation.mutate(task.id)}
          disabled={deleteMutation.isPending}
          className="kanban-task-card__delete"
          aria-label="Удалить задачу"
        >
          ×
        </button>
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
