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
import { FormEvent, useCallback, useMemo, useRef, useState } from 'react';
import { useMeQuery } from '@/features/auth/hooks';
import { formatMinutes } from '@/shared/lib/format-duration';
import { formatRecurrenceLabel } from '@/shared/lib/format-recurrence';
import { formatOverdueLabel, isTaskOverdue } from '../lib/overdue';
import {
  useBoardQuery,
  useCreateColumnMutation,
  useCreateTaskMutation,
  useDeleteColumnMutation,
  useMoveColumnMutation,
  useMoveTaskMutation,
  useUpdateColumnMutation,
} from '../hooks';
import {
  EMPTY_BOARD_FILTERS,
  PRIORITY_LABELS,
  type BoardColumn,
  type BoardFilters,
  type BoardTask,
  type BoardView,
} from '../types';
import { BoardFiltersBar } from './board-filters-bar';
import { BoardWorkloadPanel } from './board-workload-panel';
import { ColumnAutomationDialog } from './column-automation-dialog';
import { TaskDetailDrawer } from './task-detail-drawer';

type DragType = 'column' | 'task';

export function KanbanBoard({ workspaceId }: { workspaceId: string }) {
  const { data: session } = useMeQuery();
  const { data: board, isLoading } = useBoardQuery(workspaceId);
  const moveTaskMutation = useMoveTaskMutation(workspaceId);
  const moveColumnMutation = useMoveColumnMutation(workspaceId);
  const [activeTask, setActiveTask] = useState<BoardTask | null>(null);
  const [activeColumn, setActiveColumn] = useState<BoardColumn | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [filters, setFilters] = useState<BoardFilters>(EMPTY_BOARD_FILTERS);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const filteredColumns = useMemo(() => {
    if (!board) return [];
    return board.columns.map((column) => ({
      ...column,
      tasks: column.tasks.filter((task) =>
        matchesFilters(task, column, board.columns, filters, session?.user.id),
      ),
    }));
  }, [board, filters, session?.user.id]);

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
  const workspaceRole = session?.workspaces.find((workspace) => workspace.id === workspaceId)?.role;
  const canManageAutomations = workspaceRole === 'OWNER' || workspaceRole === 'ADMIN';
  const canDeleteColumns = canManageAutomations && board.columns.length > 1;

  return (
    <>
      <BoardFiltersBar workspaceId={workspaceId} filters={filters} onChange={setFilters} />
      <BoardWorkloadPanel board={board} />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="kanban-board">
          <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
            {filteredColumns.map((column) => (
              <SortableKanbanColumn
                key={column.id}
                column={column}
                allColumns={board.columns}
                workspaceId={workspaceId}
                canDelete={canDeleteColumns}
                canManageAutomations={canManageAutomations}
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

function matchesFilters(
  task: BoardTask,
  column: BoardColumn,
  columns: BoardColumn[],
  filters: BoardFilters,
  currentUserId?: string,
) {
  if (filters.search) {
    const q = filters.search.toLowerCase();
    const haystack = `${task.title} ${task.description ?? ''}`.toLowerCase();
    if (!haystack.includes(q)) return false;
  }

  if (filters.priority && task.priority !== filters.priority) return false;

  if (filters.assigneeId && task.assigneeId !== filters.assigneeId) return false;

  if (filters.myTasksOnly) {
    if (!currentUserId || task.assigneeId !== currentUserId) return false;
  }

  const overdue = isTaskOverdue(task, column, columns);
  if (filters.overdueStatus === 'overdue' && !overdue) return false;
  if (filters.overdueStatus === 'not_overdue' && overdue) return false;

  return true;
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
  allColumns,
  workspaceId,
  canDelete,
  canManageAutomations,
  onOpenTask,
}: {
  column: BoardColumn;
  allColumns: BoardColumn[];
  workspaceId: string;
  canDelete: boolean;
  canManageAutomations: boolean;
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
        allColumns={allColumns}
        workspaceId={workspaceId}
        canDelete={canDelete}
        canManageAutomations={canManageAutomations}
        dragHandleProps={{ ...attributes, ...listeners }}
        onOpenTask={onOpenTask}
      />
    </div>
  );
}

function KanbanColumn({
  column,
  allColumns,
  workspaceId,
  canDelete,
  canManageAutomations,
  dragHandleProps,
  onOpenTask,
}: {
  column: BoardColumn;
  allColumns: BoardColumn[];
  workspaceId: string;
  canDelete: boolean;
  canManageAutomations: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLElement>;
  onOpenTask: (taskId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const createMutation = useCreateTaskMutation(workspaceId);
  const updateColumnMutation = useUpdateColumnMutation(workspaceId);
  const deleteColumnMutation = useDeleteColumnMutation(workspaceId);
  const [title, setTitle] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [columnName, setColumnName] = useState(column.name);
  const [automationOpen, setAutomationOpen] = useState(false);
  const automationBtnRef = useRef<HTMLButtonElement>(null);
  const handleAutomationClose = useCallback(() => {
    setAutomationOpen(false);
    automationBtnRef.current?.focus();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) return;
    await createMutation.mutateAsync({ title: title.trim(), columnId: column.id });
    setTitle('');
  };

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

  const handleDelete = async () => {
    const message =
      column.tasks.length > 0
        ? `Удалить колонку «${column.name}» вместе с ${column.tasks.length} задачами?`
        : `Удалить колонку «${column.name}»?`;
    if (!window.confirm(message)) return;
    await deleteColumnMutation.mutateAsync(column.id);
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

        <span className="kanban-column__count">{column.tasks.length}</span>

        {canManageAutomations ? (
          <button
            ref={automationBtnRef}
            type="button"
            className={`kanban-column__automation ${
              column.automations.length > 0 ? 'kanban-column__automation--active' : ''
            }`}
            onClick={() => setAutomationOpen(true)}
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

      <SortableContext
        items={column.tasks.map((task) => task.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="kanban-column__tasks">
          {column.tasks.map((task) => (
            <KanbanTaskCard
              key={task.id}
              task={task}
              column={column}
              allColumns={allColumns}
              onOpen={() => onOpenTask(task.id)}
            />
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

      {automationOpen ? (
        <ColumnAutomationDialog
          workspaceId={workspaceId}
          column={column}
          onClose={handleAutomationClose}
        />
      ) : null}
    </div>
  );
}

function KanbanTaskCard({
  task,
  column,
  allColumns,
  onOpen,
}: {
  task: BoardTask;
  column: BoardColumn;
  allColumns: BoardColumn[];
  onOpen: () => void;
}) {
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
  const recurrenceLabel = formatRecurrenceLabel(task.recurrenceRule, task.recurrenceWeekdays);
  const overdueLabel = formatOverdueLabel(task, column, allColumns);
  const isOverdue = isTaskOverdue(task, column, allColumns);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`kanban-task-card ${isOverdue ? 'kanban-task-card--overdue' : ''}`}
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
          {(task.priority ||
            task.complexity ||
            task.timeEstimateMinutes ||
            task.actualMinutes ||
            task.timerStartedAt ||
            task.completedAt ||
            dueLabel ||
            recurrenceLabel ||
            overdueLabel ||
            task.assignee) && (
            <div className="kanban-task-meta">
              {overdueLabel ? (
                <span className="kanban-task-chip kanban-task-chip--overdue">{overdueLabel}</span>
              ) : null}
              {recurrenceLabel ? (
                <span className="kanban-task-chip kanban-task-chip--recurrence">
                  {recurrenceLabel}
                </span>
              ) : null}
              {task.assignee ? (
                <span className="kanban-task-chip">{task.assignee.name.split(' ')[0]}</span>
              ) : null}
              {task.priority ? (
                <span className={`kanban-task-chip kanban-task-chip--priority-${task.priority}`}>
                  {PRIORITY_LABELS[task.priority]}
                </span>
              ) : null}
              {task.complexity ? (
                <span className="kanban-task-chip">{task.complexity} SP</span>
              ) : null}
              {task.timeEstimateMinutes ? (
                <span className="kanban-task-chip kanban-task-chip--estimate">
                  {formatMinutes(task.timeEstimateMinutes)}
                </span>
              ) : null}
              {task.actualMinutes ? (
                <span className="kanban-task-chip kanban-task-chip--actual">
                  факт {formatMinutes(task.actualMinutes)}
                </span>
              ) : null}
              {task.timerStartedAt ? (
                <span className="kanban-task-chip kanban-task-chip--timer">таймер запущен</span>
              ) : null}
              {task.completedAt ? (
                <span className="kanban-task-chip kanban-task-chip--complete">выполнено</span>
              ) : null}
              {dueLabel ? (
                <span
                  className={`kanban-task-chip ${isOverdue ? 'kanban-task-chip--overdue-date' : ''}`}
                >
                  {dueLabel}
                </span>
              ) : null}
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
