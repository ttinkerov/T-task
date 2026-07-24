'use client';

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
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
import dynamic from 'next/dynamic';
import { FormEvent, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BoardSkeleton } from '@/components/ui/skeleton';
import { TaskCheckbox } from '@/components/ui/task-checkbox';
import { useMeQuery } from '@/features/auth/hooks';
import { useCustomFieldsQuery } from '@/features/custom-fields/hooks';
import type { CustomFieldDefinition } from '@/features/custom-fields/types';
import { BulkActionsToolbar } from './bulk-actions-toolbar';
import { toggleTaskSelection } from '../lib/bulk-selection';
import { useCreateTaskShortcutListener } from '@/features/shell/hooks/use-shortcut-handlers';
import { useTaskTemplatesQuery } from '@/features/templates';
import { tokenizeMentions } from '@/features/mentions/mention-utils';
import { useMembersQuery } from '@/features/workspaces/hooks';
import { celebrateTaskComplete } from '@/shared/lib/celebrate';
import { formatMinutes } from '@/shared/lib/format-duration';
import { formatRecurrenceLabel } from '@/shared/lib/format-recurrence';
import { formatAgingLabel, getAgingLevel, isDoneColumn, isTaskOverdue } from '../lib/overdue';
import {
  calendarRangeFromStoredView,
  normalizeBoardViewMode,
  normalizeCalendarRange,
  type BoardViewMode,
  type CalendarRange,
} from '../lib/task-view-utils';
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
  type TaskTag,
} from '../types';
import { BoardFiltersBar } from './board-filters-bar';
import { BoardSprintPanel } from './board-sprint-panel';
import { BoardSwitcher, storeSelectedBoardId } from './board-switcher';
import { BoardWorkloadPanel } from './board-workload-panel';
import { ColumnAutomationDialog } from './column-automation-dialog';
import { TaskDisplayView, TaskViewToolbar } from './task-display-views';

const TaskDetailDrawer = dynamic(
  () => import('./task-detail-drawer').then((mod) => ({ default: mod.TaskDetailDrawer })),
  { ssr: false },
);

const EMPTY_TAGS: TaskTag[] = [];
const EMPTY_SUBTASKS: NonNullable<BoardTask['subtasks']> = [];
const COLUMN_VISIBLE_STEP = 40;

const FOCUS_CREATE_KEY = 'ttask:focus-create';

function focusCreateTaskInput() {
  const input = document.querySelector<HTMLInputElement>('.kanban-column__add-input');
  input?.focus();
  input?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

type DragType = 'column' | 'task';

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
  const [bulkSelectedIds, setBulkSelectedIds] = useState<Set<string>>(() => new Set());
  const bulkAnchorIdRef = useRef<string | null>(null);
  const openedInitialTaskRef = useRef<string | null>(null);
  const [filters, setFilters] = useState<BoardFilters>(EMPTY_BOARD_FILTERS);
  const [moveError, setMoveError] = useState('');
  const [viewMode, setViewMode] = useState<BoardViewMode>('BOARD');
  const [calendarRange, setCalendarRange] = useState<CalendarRange>('WEEK');
  const [viewAnchor, setViewAnchor] = useState(() => new Date());

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
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
          isEpic: Boolean(task.isEpic),
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
    const stored = readStoredViewPrefs(workspaceId);
    setViewMode(stored.mode);
    setCalendarRange(stored.calendarRange);
    setViewAnchor(new Date());
    setBoardId(null);
    setFilters(EMPTY_BOARD_FILTERS);
    setBulkSelectedIds(new Set());
    bulkAnchorIdRef.current = null;
  }, [workspaceId]);

  useEffect(() => {
    setBulkSelectedIds(new Set());
    bulkAnchorIdRef.current = null;
  }, [boardId, viewMode]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setBulkSelectedIds(new Set());
        bulkAnchorIdRef.current = null;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useCreateTaskShortcutListener(() => {
    if (viewMode !== 'BOARD') return;
    focusCreateTaskInput();
  });

  useEffect(() => {
    if (viewMode !== 'BOARD' || !boardId) return;
    try {
      if (window.sessionStorage.getItem(FOCUS_CREATE_KEY) !== '1') return;
      window.sessionStorage.removeItem(FOCUS_CREATE_KEY);
      window.requestAnimationFrame(() => focusCreateTaskInput());
    } catch {
      // ignore
    }
  }, [boardId, viewMode]);

  const orderedTaskIds = useMemo(
    () => filteredColumns.flatMap((column) => column.tasks.map((task) => task.id)),
    [filteredColumns],
  );

  const handleToggleSelect = useCallback(
    (taskId: string, event: { shiftKey: boolean; metaKey: boolean; ctrlKey: boolean }) => {
      const result = toggleTaskSelection(bulkSelectedIds, taskId, orderedTaskIds, {
        additive: event.metaKey || event.ctrlKey,
        range: event.shiftKey,
        anchorId: bulkAnchorIdRef.current,
      });
      setBulkSelectedIds(result.next);
      bulkAnchorIdRef.current = result.anchorId;
    },
    [bulkSelectedIds, orderedTaskIds],
  );

  const handleCompleteTask = useCallback(
    (task: BoardTask) => {
      const columns = board?.columns;
      if (!columns) return;
      const done = findDoneColumn(columns);
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
          setMoveError(error instanceof Error ? error.message : 'Не удалось завершить задачу');
        });
    },
    [board?.columns, moveTaskMutation],
  );

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
        calendarRange={calendarRange}
        onModeChange={(mode) => {
          setMoveError('');
          setViewMode(mode);
          storeViewMode(workspaceId, mode);
        }}
        onAnchorChange={setViewAnchor}
        onCalendarRangeChange={(range) => {
          setCalendarRange(range);
          storeCalendarRange(workspaceId, range);
        }}
      />
      <BoardSwitcher
        workspaceId={workspaceId}
        boardId={boardId}
        onBoardChange={handleBoardChange}
      />
      <BoardFiltersBar
        workspaceId={workspaceId}
        boardId={boardId}
        filters={filters}
        onChange={setFilters}
      />
      {board.columns.some((column) => column.truncated) ? (
        <p className="kanban-board__error" role="status">
          В колонке показано до 200 задач. Остальные откройте через фильтры или «Все задачи».
        </p>
      ) : null}
      {viewMode === 'BOARD' && moveError ? (
        <p className="kanban-board__error" role="alert">
          {moveError}
        </p>
      ) : null}
      {viewMode === 'BOARD' ? <BoardWorkloadPanel board={board} /> : null}
      {viewMode === 'BOARD' ? <BoardSprintPanel workspaceId={workspaceId} /> : null}
      {viewMode === 'BOARD' ? (
        <BulkActionsToolbar
          workspaceId={workspaceId}
          boardId={boardId}
          columns={board.columns}
          selectedIds={bulkSelectedIds}
          onClear={() => {
            setBulkSelectedIds(new Set());
            bulkAnchorIdRef.current = null;
          }}
        />
      ) : null}

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
                  selectedIds={bulkSelectedIds}
                  selectionActive={bulkSelectedIds.size > 0}
                  onToggleSelect={handleToggleSelect}
                  onOpenTask={setSelectedTaskId}
                  onCompleteTask={handleCompleteTask}
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
          calendarRange={calendarRange}
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

  if (filters.sprintId && task.sprintId !== filters.sprintId) return false;
  if (filters.epicId && task.epicId !== filters.epicId) return false;

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
  onToggleSelect: (
    taskId: string,
    event: { shiftKey: boolean; metaKey: boolean; ctrlKey: boolean },
  ) => void;
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

function KanbanColumn({
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
  selectedIds: Set<string>;
  selectionActive: boolean;
  onToggleSelect: (
    taskId: string,
    event: { shiftKey: boolean; metaKey: boolean; ctrlKey: boolean },
  ) => void;
  dragHandleProps?: React.HTMLAttributes<HTMLElement>;
  onOpenTask: (taskId: string) => void;
  onCompleteTask: (task: BoardTask) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const createMutation = useCreateTaskMutation(workspaceId, boardId);
  const { data: taskTemplates = [] } = useTaskTemplatesQuery(workspaceId);
  const taskIds = useMemo(() => column.tasks.map((task) => task.id), [column.tasks]);
  const [visibleCount, setVisibleCount] = useState(() =>
    Math.min(COLUMN_VISIBLE_STEP, column.tasks.length),
  );

  useEffect(() => {
    setVisibleCount(Math.min(COLUMN_VISIBLE_STEP, column.tasks.length));
  }, [column.id, column.tasks.length]);

  const visibleTasks = useMemo(
    () => column.tasks.slice(0, visibleCount),
    [column.tasks, visibleCount],
  );
  const hiddenCount = Math.max(0, column.tasks.length - visibleCount);
  const updateColumnMutation = useUpdateColumnMutation(workspaceId, boardId);
  const deleteColumnMutation = useDeleteColumnMutation(workspaceId, boardId);
  const [title, setTitle] = useState('');
  const [templateId, setTemplateId] = useState('');
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
    const selected = taskTemplates.find((template) => template.id === templateId);
    const nextTitle = title.trim() || selected?.title?.trim() || '';
    if (!nextTitle) return;
    await createMutation.mutateAsync({
      title: nextTitle,
      columnId: column.id,
      ...(templateId ? { templateId } : {}),
    });
    setTitle('');
    setTemplateId('');
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

  const overWip =
    typeof column.wipLimit === 'number' &&
    column.wipLimit > 0 &&
    column.tasks.length > column.wipLimit;

  const handleWipBlur = async (value: string) => {
    const trimmed = value.trim();
    const next = trimmed === '' ? null : Number(trimmed);
    if (next !== null && (!Number.isInteger(next) || next < 1)) return;
    if (next === (column.wipLimit ?? null)) return;
    await updateColumnMutation.mutateAsync({ columnId: column.id, wipLimit: next });
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
    <div
      ref={setNodeRef}
      className={`kanban-column ${isOver ? 'kanban-column--over' : ''} ${overWip ? 'kanban-column--over-wip' : ''}`}
    >
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

        <span className={`kanban-column__count ${overWip ? 'kanban-column__count--over' : ''}`}>
          {column.wipLimit ? `${column.tasks.length}/${column.wipLimit}` : column.tasks.length}
        </span>
        {canManageAutomations ? (
          <input
            type="number"
            min={1}
            max={999}
            className="kanban-column__wip-input"
            title="WIP-лимит"
            aria-label="WIP-лимит колонки"
            defaultValue={column.wipLimit ?? ''}
            placeholder="WIP"
            onBlur={(event) => void handleWipBlur(event.target.value)}
            onClick={(event) => event.stopPropagation()}
          />
        ) : null}

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

      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="kanban-column__tasks">
          {visibleTasks.map((task) => (
            <KanbanTaskCard
              key={task.id}
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
          ))}
          {hiddenCount > 0 ? (
            <button
              type="button"
              className="kanban-column__show-more"
              onClick={() =>
                setVisibleCount((count) =>
                  Math.min(count + COLUMN_VISIBLE_STEP, column.tasks.length),
                )
              }
            >
              Ещё {Math.min(COLUMN_VISIBLE_STEP, hiddenCount)} из {hiddenCount}
            </button>
          ) : null}
        </div>
      </SortableContext>

      <form onSubmit={handleSubmit} className="kanban-column__add">
        {taskTemplates.length > 0 ? (
          <select
            className="kanban-column__add-template"
            value={templateId}
            onChange={(event) => {
              const nextId = event.target.value;
              setTemplateId(nextId);
              const selected = taskTemplates.find((template) => template.id === nextId);
              if (selected?.title && !title.trim()) {
                setTitle(selected.title);
              }
            }}
            aria-label="Шаблон задачи"
          >
            <option value="">Без шаблона</option>
            {taskTemplates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        ) : null}
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Задача..."
          className="kanban-column__add-input"
        />
        <button
          type="submit"
          disabled={
            createMutation.isPending ||
            !(title.trim() || taskTemplates.find((template) => template.id === templateId)?.title)
          }
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

const KanbanTaskCard = memo(function KanbanTaskCard({
  task,
  column,
  allColumns,
  cardFields,
  memberNames,
  selected,
  selectionActive,
  onToggleSelect,
  onOpenTask,
  onCompleteTask,
}: {
  task: BoardTask;
  column: BoardColumn;
  allColumns: BoardColumn[];
  cardFields: CustomFieldDefinition[];
  memberNames: Map<string, string>;
  selected: boolean;
  selectionActive: boolean;
  onToggleSelect: (
    taskId: string,
    event: { shiftKey: boolean; metaKey: boolean; ctrlKey: boolean },
  ) => void;
  onOpenTask: (taskId: string) => void;
  onCompleteTask: (task: BoardTask) => void;
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
  const overdueLabel = formatAgingLabel(task, column, allColumns);
  const agingLevel = getAgingLevel(task, column, allColumns);
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
  const tags = task.tags ?? EMPTY_TAGS;
  const subtasks = task.subtasks ?? EMPTY_SUBTASKS;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`kanban-task-card kanban-task ${selected ? 'kanban-task-card--selected' : ''} ${agingLevel !== 'none' ? `kanban-task-card--aging-${agingLevel}` : ''} ${isOverdue ? 'kanban-task-card--overdue' : ''} ${task.isEpic ? 'kanban-task-card--epic' : ''} ${isDragging ? 'kanban-task--dragging' : ''}`}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || selectionActive) {
          event.preventDefault();
          onToggleSelect(task.id, event);
          return;
        }
        onOpenTask(task.id);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpenTask(task.id);
        }
      }}
      role="button"
      tabIndex={0}
      aria-selected={selected}
    >
      <div className="kanban-task-card__body">
        <input
          type="checkbox"
          className="kanban-task-card__select"
          checked={selected}
          aria-label={`Выбрать задачу ${task.title}`}
          onClick={(event) => event.stopPropagation()}
          onChange={(event) =>
            onToggleSelect(task.id, {
              shiftKey: (event.nativeEvent as MouseEvent).shiftKey,
              metaKey: (event.nativeEvent as MouseEvent).metaKey,
              ctrlKey: (event.nativeEvent as MouseEvent).ctrlKey,
            })
          }
        />
        <TaskCheckbox
          animated={false}
          checked={isComplete}
          ariaLabel={isComplete ? 'Задача выполнена' : 'Отметить выполненной'}
          onChange={(checked) => {
            if (checked && !isComplete) onCompleteTask(task);
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
            tags.length > 0 ||
            subtasks.length > 0 ||
            customFieldChips.length > 0 ||
            task.assignee) && (
            <div className="kanban-task-meta">
              {tags.slice(0, 3).map((tag) => (
                <span
                  key={tag.id}
                  className="tag-chip"
                  style={{ background: `${tag.color}22`, color: tag.color, borderColor: tag.color }}
                >
                  <i style={{ background: tag.color }} />
                  {tag.name}
                </span>
              ))}
              {subtasks.length > 0 ? (
                <span className="kanban-task-chip">
                  {subtasks.filter((item) => item.completed).length}/{subtasks.length} шагов
                </span>
              ) : null}
              {overdueLabel ? (
                <span
                  className={`kanban-task-chip ${
                    agingLevel === 'due-today' || agingLevel === 'due-soon'
                      ? 'kanban-task-chip--due-soon'
                      : 'kanban-task-chip--overdue'
                  }`}
                >
                  {overdueLabel}
                </span>
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
});

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

function readStoredViewPrefs(workspaceId: string): {
  mode: BoardViewMode;
  calendarRange: CalendarRange;
} {
  try {
    const stored = window.localStorage.getItem(`ttask:view-mode:${workspaceId}`);
    const mode = normalizeBoardViewMode(stored) ?? 'BOARD';
    const storedRange = window.localStorage.getItem(`ttask:calendar-range:${workspaceId}`);
    const calendarRange =
      normalizeCalendarRange(storedRange) ?? calendarRangeFromStoredView(stored) ?? 'WEEK';
    return { mode, calendarRange };
  } catch (error) {
    console.warn('Unable to read the saved board view mode', error);
    return { mode: 'BOARD', calendarRange: 'WEEK' };
  }
}

function storeViewMode(workspaceId: string, mode: BoardViewMode) {
  try {
    window.localStorage.setItem(`ttask:view-mode:${workspaceId}`, mode);
  } catch (error) {
    console.warn('Unable to save the board view mode', error);
  }
}

function storeCalendarRange(workspaceId: string, range: CalendarRange) {
  try {
    window.localStorage.setItem(`ttask:calendar-range:${workspaceId}`, range);
  } catch (error) {
    console.warn('Unable to save the calendar range', error);
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
