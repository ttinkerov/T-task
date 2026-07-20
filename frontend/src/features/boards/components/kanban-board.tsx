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
import { GripVertical } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BoardSkeleton } from '@/components/ui/skeleton';
import { TaskCheckbox } from '@/components/ui/task-checkbox';
import { useMeQuery } from '@/features/auth/hooks';
import { useCustomFieldsQuery } from '@/features/custom-fields/hooks';
import type { CustomFieldDefinition } from '@/features/custom-fields/types';
import { tokenizeMentions } from '@/features/mentions/mention-utils';
import { useMembersQuery } from '@/features/workspaces/hooks';
import { celebrateTaskComplete } from '@/shared/lib/celebrate';
import { formatMinutes } from '@/shared/lib/format-duration';
import { formatRecurrenceLabel } from '@/shared/lib/format-recurrence';
import { formatOverdueLabel, isDoneColumn, isTaskOverdue } from '../lib/overdue';
import type { BoardViewMode } from '../lib/task-view-utils';
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
import { BoardSwitcher, storeSelectedBoardId } from './board-switcher';
import { BoardWorkloadPanel } from './board-workload-panel';
import { ColumnAutomationDialog } from './column-automation-dialog';
import { TaskDisplayView, TaskViewToolbar } from './task-display-views';
import { TaskDetailDrawer } from './task-detail-drawer';

type DragType = 'column' | 'task';
const BOARD_VIEW_MODES: BoardViewMode[] = ['BOARD', 'LIST', 'WEEK', 'MONTH', 'GANTT'];

export function KanbanBoard({
  workspaceId,
  initialTaskId = null,
}: {
  workspaceId: string;
  initialTaskId?: string | null;
}) {
  const { data: session } = useMeQuery();
  const [boardId, setBoardId] = useState<string | null>(null);
  const handleBoardChange = useCallback(
    (nextId: string) => {
      setBoardId(nextId);
      storeSelectedBoardId(workspaceId, nextId);
    },
    [workspaceId],
  );
  const { data: board, isLoading } = useBoardQuery(workspaceId, boardId);
  const { data: customFields = [] } = useCustomFieldsQuery(workspaceId);
  const { data: members = [] } = useMembersQuery(workspaceId);
  const moveTaskMutation = useMoveTaskMutation(workspaceId, boardId ?? '');
  const moveColumnMutation = useMoveColumnMutation(workspaceId, boardId ?? '');
  const [activeTask, setActiveTask] = useState<BoardTask | null>(null);
  const [activeColumn, setActiveColumn] = useState<BoardColumn | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const openedInitialTaskRef = useRef<string | null>(null);
  const [filters, setFilters] = useState<BoardFilters>(EMPTY_BOARD_FILTERS);
  const [moveError, setMoveError] = useState('');
  const [viewMode, setViewMode] = useState<BoardViewMode>('BOARD');
  const [viewAnchor, setViewAnchor] = useState(() => new Date());

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
  const cardFields = useMemo(
    () => customFields.filter((field) => field.showOnCard),
    [customFields],
  );
  const memberNames = useMemo(
    () => new Map(members.map((member) => [member.userId, member.user.name])),
    [members],
  );
  const relationCandidates = useMemo(
    () =>
      board?.columns.flatMap((column) =>
        column.tasks.map((task) => ({
          id: task.id,
          title: task.title,
          columnName: column.name,
          completed: Boolean(task.completedAt) || isDoneColumn(column, board.columns),
        })),
      ) ?? [],
    [board],
  );

  useEffect(() => {
    if (
      initialTaskId &&
      openedInitialTaskRef.current !== initialTaskId &&
      findTask(board, initialTaskId)
    ) {
      openedInitialTaskRef.current = initialTaskId;
      setSelectedTaskId(initialTaskId);
    }
  }, [board, initialTaskId]);

  useEffect(() => {
    setViewMode(readStoredViewMode(workspaceId));
    setViewAnchor(new Date());
    setBoardId(null);
    setFilters(EMPTY_BOARD_FILTERS);
  }, [workspaceId]);

  const handleDragStart = (event: DragStartEvent) => {
    setMoveError('');
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
    if (!over || !board || !boardId) return;

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

    try {
      await moveTaskMutation.mutateAsync({
        taskId,
        columnId: destination.columnId,
        position: destination.position,
      });
    } catch (error) {
      setMoveError(error instanceof Error ? error.message : 'Не удалось переместить задачу');
    }
  };

  if (isLoading || !board || !boardId) {
    return (
      <>
        <BoardSwitcher
          workspaceId={workspaceId}
          boardId={boardId}
          onBoardChange={handleBoardChange}
        />
        <BoardSkeleton />
      </>
    );
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
      <TaskViewToolbar
        mode={viewMode}
        anchor={viewAnchor}
        onModeChange={(mode) => {
          setMoveError('');
          setViewMode(mode);
          storeViewMode(workspaceId, mode);
        }}
        onAnchorChange={setViewAnchor}
      />
      <BoardSwitcher
        workspaceId={workspaceId}
        boardId={boardId}
        onBoardChange={handleBoardChange}
      />
      <BoardFiltersBar workspaceId={workspaceId} filters={filters} onChange={setFilters} />
      {viewMode === 'BOARD' && moveError ? (
        <p className="kanban-board__error" role="alert">
          {moveError}
        </p>
      ) : null}
      {viewMode === 'BOARD' ? <BoardWorkloadPanel board={board} /> : null}

      {viewMode === 'BOARD' ? (
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
                  boardId={boardId}
                  canDelete={canDeleteColumns}
                  canManageAutomations={canManageAutomations}
                  cardFields={cardFields}
                  memberNames={memberNames}
                  onOpenTask={setSelectedTaskId}
                  onCompleteTask={(task) => {
                    const done = findDoneColumn(board.columns);
                    if (!done || task.columnId === done.id) return;
                    void moveTaskMutation
                      .mutateAsync({
                        taskId: task.id,
                        columnId: done.id,
                        position: done.tasks.length,
                      })
                      .then(() => {
                        if (task.priority === 'URGENT' || task.priority === 'HIGH') {
                          celebrateTaskComplete();
                        }
                      })
                      .catch((error) => {
                        setMoveError(
                          error instanceof Error ? error.message : 'Не удалось завершить задачу',
                        );
                      });
                  }}
                />
              ))}
            </SortableContext>
            <AddColumnPanel workspaceId={workspaceId} boardId={boardId} />
          </div>

          <DragOverlay>
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
          </DragOverlay>
        </DndContext>
      ) : (
        <TaskDisplayView
          mode={viewMode as Exclude<BoardViewMode, 'BOARD'>}
          columns={filteredColumns}
          anchor={viewAnchor}
          onOpenTask={setSelectedTaskId}
        />
      )}

      {selectedTask ? (
        <TaskDetailDrawer
          key={selectedTask.id}
          workspaceId={workspaceId}
          task={selectedTask}
          columnName={selectedColumnName}
          relationCandidates={relationCandidates}
          onOpenTask={setSelectedTaskId}
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

  if (filters.tagId && !(task.tags ?? []).some((tag) => tag.id === filters.tagId)) return false;

  if (filters.myTasksOnly) {
    if (!currentUserId || task.assigneeId !== currentUserId) return false;
  }

  const overdue = isTaskOverdue(task, column, columns);
  if (filters.overdueStatus === 'overdue' && !overdue) return false;
  if (filters.overdueStatus === 'not_overdue' && overdue) return false;

  return true;
}

function AddColumnPanel({ workspaceId, boardId }: { workspaceId: string; boardId: string }) {
  const createColumnMutation = useCreateColumnMutation(workspaceId, boardId);
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
  boardId,
  canDelete,
  canManageAutomations,
  cardFields,
  memberNames,
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
        dragHandleProps={{ ...attributes, ...listeners }}
        onOpenTask={onOpenTask}
        onCompleteTask={onCompleteTask}
      />
    </div>
  );
}

function KanbanColumn({
  column,
  allColumns,
  workspaceId,
  boardId,
  canDelete,
  canManageAutomations,
  cardFields,
  memberNames,
  dragHandleProps,
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
  dragHandleProps?: React.HTMLAttributes<HTMLElement>;
  onOpenTask: (taskId: string) => void;
  onCompleteTask: (task: BoardTask) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const createMutation = useCreateTaskMutation(workspaceId, boardId);
  const updateColumnMutation = useUpdateColumnMutation(workspaceId, boardId);
  const deleteColumnMutation = useDeleteColumnMutation(workspaceId, boardId);
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
              cardFields={cardFields}
              memberNames={memberNames}
              onOpen={() => onOpenTask(task.id)}
              onComplete={() => onCompleteTask(task)}
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
          boardId={boardId}
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
  cardFields,
  memberNames,
  onOpen,
  onComplete,
}: {
  task: BoardTask;
  column: BoardColumn;
  allColumns: BoardColumn[];
  cardFields: CustomFieldDefinition[];
  memberNames: Map<string, string>;
  onOpen: () => void;
  onComplete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task' as const, columnId: task.columnId },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  const dueLabel = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
    : null;
  const recurrenceLabel = formatRecurrenceLabel(task.recurrenceRule, task.recurrenceWeekdays);
  const overdueLabel = formatOverdueLabel(task, column, allColumns);
  const isOverdue = isTaskOverdue(task, column, allColumns);
  const isComplete = Boolean(task.completedAt) || isDoneColumn(column, allColumns);
  const customFieldChips = cardFields
    .map((field) => {
      const entry = task.customFields.find((item) => item.fieldId === field.id);
      const label = formatCustomFieldValue(field, entry?.value ?? null, memberNames);
      return label ? { id: field.id, label } : null;
    })
    .filter((chip): chip is { id: string; label: string } => chip !== null);
  const description = task.description ? toPlainMentionText(task.description, memberNames) : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`kanban-task-card kanban-task ${isOverdue ? 'kanban-task-card--overdue' : ''} ${isDragging ? 'kanban-task--dragging' : ''}`}
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
        <TaskCheckbox
          checked={isComplete}
          ariaLabel={isComplete ? 'Задача выполнена' : 'Отметить выполненной'}
          onChange={(checked) => {
            if (checked && !isComplete) onComplete();
          }}
        />
        <button
          type="button"
          className="kanban-task-card__drag"
          {...attributes}
          {...listeners}
          onClick={(event) => event.stopPropagation()}
          aria-label="Перетащить задачу"
        >
          <GripVertical size={14} strokeWidth={1.75} aria-hidden="true" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="kanban-task-card__title">{task.title}</p>
          {description ? <p className="kanban-task-card__desc">{description}</p> : null}
          {(task.priority ||
            task.complexity ||
            task.timeEstimateMinutes ||
            task.actualMinutes ||
            task.timerStartedAt ||
            task.completedAt ||
            dueLabel ||
            recurrenceLabel ||
            overdueLabel ||
            (task.tags ?? []).length > 0 ||
            (task.subtasks ?? []).length > 0 ||
            customFieldChips.length > 0 ||
            task.assignee) && (
            <div className="kanban-task-meta">
              {(task.tags ?? []).slice(0, 3).map((tag) => (
                <span
                  key={tag.id}
                  className="tag-chip"
                  style={{ background: `${tag.color}22`, color: tag.color, borderColor: tag.color }}
                >
                  <i style={{ background: tag.color }} />
                  {tag.name}
                </span>
              ))}
              {(task.subtasks ?? []).length > 0 ? (
                <span className="kanban-task-chip">
                  {(task.subtasks ?? []).filter((item) => item.completed).length}/
                  {(task.subtasks ?? []).length} шагов
                </span>
              ) : null}
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
              {customFieldChips.map((chip) => (
                <span key={chip.id} className="kanban-task-chip kanban-task-chip--custom">
                  {chip.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatCustomFieldValue(
  field: CustomFieldDefinition,
  value: BoardTask['customFields'][number]['value'],
  memberNames: Map<string, string>,
): string | null {
  if (value === null || value === undefined || value === '') return null;

  switch (field.type) {
    case 'CHECKBOX':
      return value === true ? `${field.name}: да` : null;
    case 'MULTI_SELECT': {
      if (!Array.isArray(value) || value.length === 0) return null;
      return `${field.name}: ${value.join(', ')}`;
    }
    case 'USER': {
      const name = typeof value === 'string' ? memberNames.get(value) : undefined;
      return name ? `${field.name}: ${name}` : null;
    }
    case 'DATE': {
      if (typeof value !== 'string') return null;
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return null;
      return `${field.name}: ${date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}`;
    }
    default:
      return `${field.name}: ${String(value)}`;
  }
}

function toPlainMentionText(text: string, memberNames: Map<string, string>) {
  return tokenizeMentions(text)
    .map((token) =>
      token.type === 'text'
        ? token.value
        : `@${memberNames.get(token.userId) ?? token.value.slice(1)}`,
    )
    .join('');
}

function readStoredViewMode(workspaceId: string): BoardViewMode {
  try {
    const stored = window.localStorage.getItem(`ttask:view-mode:${workspaceId}`);
    return BOARD_VIEW_MODES.includes(stored as BoardViewMode) ? (stored as BoardViewMode) : 'BOARD';
  } catch (error) {
    console.warn('Unable to read the saved board view mode', error);
    return 'BOARD';
  }
}

function storeViewMode(workspaceId: string, mode: BoardViewMode) {
  try {
    window.localStorage.setItem(`ttask:view-mode:${workspaceId}`, mode);
  } catch (error) {
    console.warn('Unable to save the board view mode', error);
  }
}

function findTask(board: BoardView | null | undefined, taskId: string) {
  if (!board) return null;
  for (const column of board.columns) {
    const task = column.tasks.find((item) => item.id === taskId);
    if (task) return task;
  }
  return null;
}

function findDoneColumn(columns: BoardColumn[]) {
  return (
    columns.find((column) => isDoneColumn(column, columns)) ?? columns[columns.length - 1] ?? null
  );
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
