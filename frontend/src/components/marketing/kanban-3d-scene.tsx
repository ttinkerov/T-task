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
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FormEvent, useId, useState } from 'react';

type DemoTask = {
  id: string;
  title: string;
  columnId: string;
};

type DemoColumn = {
  id: string;
  name: string;
  tasks: DemoTask[];
};

type DragType = 'column' | 'task';

const INITIAL_COLUMNS: DemoColumn[] = [
  {
    id: 'demo-col-1',
    name: 'Бэклог',
    tasks: [
      { id: 'demo-task-1', title: 'Исследование', columnId: 'demo-col-1' },
      { id: 'demo-task-2', title: 'Прототип', columnId: 'demo-col-1' },
    ],
  },
  {
    id: 'demo-col-2',
    name: 'В работе',
    tasks: [{ id: 'demo-task-3', title: 'Дизайн UI', columnId: 'demo-col-2' }],
  },
  {
    id: 'demo-col-3',
    name: 'Готово',
    tasks: [{ id: 'demo-task-4', title: 'Авторизация', columnId: 'demo-col-3' }],
  },
];

let nextId = 100;

function createId(prefix: string): string {
  nextId += 1;
  return `${prefix}-${nextId}`;
}

export function Kanban3DScene() {
  const boardId = useId();
  const [columns, setColumns] = useState(INITIAL_COLUMNS);
  const [activeColumn, setActiveColumn] = useState<DemoColumn | null>(null);
  const [activeTask, setActiveTask] = useState<DemoTask | null>(null);
  const [newColumnName, setNewColumnName] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const type = event.active.data.current?.type as DragType | undefined;

    if (type === 'column') {
      setActiveColumn(columns.find((column) => column.id === String(event.active.id)) ?? null);
      setActiveTask(null);
      return;
    }

    setActiveColumn(null);
    setActiveTask(findTask(columns, String(event.active.id)));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveColumn(null);
    setActiveTask(null);

    const { active, over } = event;
    if (!over) return;

    const type = active.data.current?.type as DragType | undefined;

    if (type === 'column') {
      const fromIndex = columns.findIndex((column) => column.id === String(active.id));
      const toIndex = columns.findIndex((column) => column.id === String(over.id));
      if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return;
      setColumns((prev) => arrayMove(prev, fromIndex, toIndex));
      return;
    }

    const taskId = String(active.id);
    const destination = resolveDropTarget(columns, String(over.id), taskId);
    if (!destination) return;

    setColumns((prev) => moveTask(prev, taskId, destination.columnId, destination.index));
  };

  const handleAddTask = (columnId: string, title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;

    setColumns((prev) =>
      prev.map((column) =>
        column.id === columnId
          ? {
              ...column,
              tasks: [...column.tasks, { id: createId('demo-task'), title: trimmed, columnId }],
            }
          : column,
      ),
    );
  };

  const handleRenameColumn = (columnId: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    setColumns((prev) =>
      prev.map((column) => (column.id === columnId ? { ...column, name: trimmed } : column)),
    );
  };

  const handleRenameTask = (taskId: string, title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;

    setColumns((prev) =>
      prev.map((column) => ({
        ...column,
        tasks: column.tasks.map((task) =>
          task.id === taskId ? { ...task, title: trimmed } : task,
        ),
      })),
    );
  };

  const handleDeleteTask = (taskId: string) => {
    setColumns((prev) =>
      prev.map((column) => ({
        ...column,
        tasks: column.tasks.filter((task) => task.id !== taskId),
      })),
    );
  };

  const handleAddColumn = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = newColumnName.trim();
    if (!trimmed) return;

    const id = createId('demo-col');
    setColumns((prev) => [...prev, { id, name: trimmed, tasks: [] }]);
    setNewColumnName('');
  };

  const handleDeleteColumn = (columnId: string) => {
    if (columns.length <= 1) return;
    const column = columns.find((item) => item.id === columnId);
    if (!column || column.tasks.length > 0) return;
    setColumns((prev) => prev.filter((item) => item.id !== columnId));
  };

  return (
    <div className="tt-board">
      <div className="tt-board__card tt-board__card--interactive">
        <div className="tt-board__header">
          <div>
            <p className="tt-board__name">Демо режим</p>
          </div>
        </div>

        <p className="tt-board__hint">
          Перетаскивайте колонки и задачи, добавляйте новые и переименовывайте колонки по клику.
        </p>

        <DndContext
          id={boardId}
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => {
            setActiveColumn(null);
            setActiveTask(null);
          }}
        >
          <div className="tt-demo-board">
            <SortableContext
              items={columns.map((column) => column.id)}
              strategy={horizontalListSortingStrategy}
            >
              {columns.map((column) => (
                <DemoColumnCard
                  key={column.id}
                  column={column}
                  canDelete={columns.length > 1 && column.tasks.length === 0}
                  onAddTask={handleAddTask}
                  onRenameColumn={handleRenameColumn}
                  onRenameTask={handleRenameTask}
                  onDeleteTask={handleDeleteTask}
                  onDeleteColumn={handleDeleteColumn}
                />
              ))}
            </SortableContext>

            <form onSubmit={handleAddColumn} className="tt-demo-board__add-column">
              <input
                value={newColumnName}
                onChange={(event) => setNewColumnName(event.target.value)}
                placeholder="Новая колонка"
                maxLength={40}
                className="tt-demo-board__input"
              />
              <button
                type="submit"
                disabled={!newColumnName.trim()}
                className="tt-demo-board__add-btn"
              >
                +
              </button>
            </form>
          </div>

          <DragOverlay>
            {activeColumn ? (
              <div className="tt-demo-column tt-demo-column--dragging">
                <div className="tt-demo-column__header">
                  <span className="tt-demo-column__drag">⠿</span>
                  <span className="tt-demo-column__title">{activeColumn.name}</span>
                  <span className="tt-demo-column__count">{activeColumn.tasks.length}</span>
                </div>
              </div>
            ) : null}
            {activeTask ? (
              <div className="tt-demo-task tt-demo-task--dragging">
                <span className="tt-demo-task__drag">⠿</span>
                <span className="tt-demo-task__title">{activeTask.title}</span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}

function DemoColumnCard({
  column,
  canDelete,
  onAddTask,
  onRenameColumn,
  onRenameTask,
  onDeleteTask,
  onDeleteColumn,
}: {
  column: DemoColumn;
  canDelete: boolean;
  onAddTask: (columnId: string, title: string) => void;
  onRenameColumn: (columnId: string, name: string) => void;
  onRenameTask: (taskId: string, title: string) => void;
  onDeleteTask: (taskId: string) => void;
  onDeleteColumn: (columnId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
    data: { type: 'column' as const },
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: column.id });
  const [taskTitle, setTaskTitle] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [columnName, setColumnName] = useState(column.name);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!taskTitle.trim()) return;
    onAddTask(column.id, taskTitle);
    setTaskTitle('');
  };

  const commitRename = () => {
    onRenameColumn(column.id, columnName);
    setEditingName(false);
  };

  return (
    <div ref={setNodeRef} style={style} className="tt-demo-column-wrap">
      <div ref={setDropRef} className={`tt-demo-column${isOver ? ' tt-demo-column--over' : ''}`}>
        <div className="tt-demo-column__header">
          <button
            type="button"
            className="tt-demo-column__drag"
            {...attributes}
            {...listeners}
            aria-label="Перетащить колонку"
          >
            ⠿
          </button>

          {editingName ? (
            <input
              value={columnName}
              onChange={(event) => setColumnName(event.target.value)}
              onBlur={commitRename}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  commitRename();
                }
                if (event.key === 'Escape') {
                  setColumnName(column.name);
                  setEditingName(false);
                }
              }}
              className="tt-demo-column__title-input"
              autoFocus
              maxLength={40}
            />
          ) : (
            <button
              type="button"
              className="tt-demo-column__title"
              onClick={() => {
                setColumnName(column.name);
                setEditingName(true);
              }}
              title="Переименовать"
            >
              {column.name}
            </button>
          )}

          <span className="tt-demo-column__count">{column.tasks.length}</span>

          {canDelete ? (
            <button
              type="button"
              className="tt-demo-column__delete"
              onClick={() => onDeleteColumn(column.id)}
              aria-label="Удалить колонку"
              title="Удалить пустую колонку"
            >
              ×
            </button>
          ) : null}
        </div>

        <SortableContext
          items={column.tasks.map((task) => task.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="tt-demo-column__tasks">
            {column.tasks.map((task) => (
              <DemoTaskCard
                key={task.id}
                task={task}
                onRename={onRenameTask}
                onDelete={onDeleteTask}
              />
            ))}
          </div>
        </SortableContext>

        <form onSubmit={handleSubmit} className="tt-demo-column__add">
          <input
            value={taskTitle}
            onChange={(event) => setTaskTitle(event.target.value)}
            placeholder="Новая задача..."
            maxLength={120}
            className="tt-demo-column__add-input"
          />
          <button
            type="submit"
            disabled={!taskTitle.trim()}
            className="tt-demo-column__add-btn"
            aria-label="Добавить задачу"
          >
            +
          </button>
        </form>
      </div>
    </div>
  );
}

function DemoTaskCard({
  task,
  onRename,
  onDelete,
}: {
  task: DemoTask;
  onRename: (taskId: string, title: string) => void;
  onDelete: (taskId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task' as const, columnId: task.columnId },
  });
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  const commitRename = () => {
    onRename(task.id, title);
    setEditing(false);
  };

  return (
    <div ref={setNodeRef} style={style} className="tt-demo-task">
      <button
        type="button"
        className="tt-demo-task__drag"
        {...attributes}
        {...listeners}
        aria-label="Перетащить задачу"
      >
        ⠿
      </button>

      {editing ? (
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onBlur={commitRename}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              commitRename();
            }
            if (event.key === 'Escape') {
              setTitle(task.title);
              setEditing(false);
            }
          }}
          className="tt-demo-task__input"
          autoFocus
          maxLength={120}
        />
      ) : (
        <button
          type="button"
          className="tt-demo-task__title"
          onDoubleClick={() => {
            setTitle(task.title);
            setEditing(true);
          }}
          title="Двойной клик — переименовать"
        >
          {task.title}
        </button>
      )}

      <button
        type="button"
        className="tt-demo-task__delete"
        onClick={() => onDelete(task.id)}
        aria-label="Удалить задачу"
      >
        ×
      </button>
    </div>
  );
}

function findTask(columns: DemoColumn[], taskId: string): DemoTask | null {
  for (const column of columns) {
    const task = column.tasks.find((item) => item.id === taskId);
    if (task) return task;
  }
  return null;
}

function resolveDropTarget(columns: DemoColumn[], overId: string, taskId: string) {
  const columnMatch = columns.find((column) => column.id === overId);
  if (columnMatch) {
    const activeTask = findTask(columns, taskId);
    if (activeTask?.columnId === columnMatch.id) {
      return { columnId: columnMatch.id, index: Math.max(0, columnMatch.tasks.length - 1) };
    }
    return { columnId: columnMatch.id, index: columnMatch.tasks.length };
  }

  const overTask = findTask(columns, overId);
  if (!overTask) return null;

  const column = columns.find((item) => item.id === overTask.columnId);
  if (!column) return null;

  const overIndex = column.tasks.findIndex((item) => item.id === overId);
  const sourceColumn = columns.find((col) => col.tasks.some((task) => task.id === taskId));
  if (!sourceColumn) return null;

  const activeIndex = sourceColumn.tasks.findIndex((item) => item.id === taskId);
  if (sourceColumn.id === column.id && overIndex > activeIndex) {
    return { columnId: column.id, index: overIndex };
  }

  return { columnId: column.id, index: overIndex };
}

function moveTask(
  columns: DemoColumn[],
  taskId: string,
  targetColumnId: string,
  targetIndex: number,
): DemoColumn[] {
  const sourceColumn = columns.find((column) => column.tasks.some((task) => task.id === taskId));
  const task = sourceColumn?.tasks.find((item) => item.id === taskId);
  if (!sourceColumn || !task) return columns;

  const withoutTask = columns.map((column) => ({
    ...column,
    tasks: column.tasks.filter((item) => item.id !== taskId),
  }));

  return withoutTask.map((column) => {
    if (column.id !== targetColumnId) return column;

    const nextTasks = [...column.tasks];
    const insertIndex = Math.min(Math.max(targetIndex, 0), nextTasks.length);
    nextTasks.splice(insertIndex, 0, { ...task, columnId: targetColumnId });
    return { ...column, tasks: nextTasks };
  });
}
