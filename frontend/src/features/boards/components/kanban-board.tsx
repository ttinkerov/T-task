'use client';

import { DndContext, DragOverlay, closestCorners } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BoardSkeleton } from '@/components/ui/skeleton';
import { useMeQuery } from '@/features/auth/hooks';
import { ViewModeTransition } from '@/features/shell/components/view-mode-transition';
import { LazyMount } from '@/shared/ui/lazy-mount';
import { BulkActionsToolbar } from './bulk-actions-toolbar';
import { findTask } from '../lib/board-lookup';
import {
  useBoardQuery,
  useBoardsQuery,
  useCreateBoardMutation,
  useCreateColumnMutation,
  useCreateTaskMutation,
} from '../hooks';
import { EMPTY_BOARD_FILTERS, type BoardFilters } from '../types';
import { BoardEmptyState } from './board-empty-state';
import { BoardFiltersBar } from './board-filters-bar';
import { BoardSwitcher, readStoredBoardId, storeSelectedBoardId } from './board-switcher';
import { AddColumnPanel } from './kanban/add-column-panel';
import { useBoardBulkSelection } from './kanban/hooks/use-board-bulk-selection';
import { useBoardTaskMoves } from './kanban/hooks/use-board-task-moves';
import { useBoardViewData } from './kanban/hooks/use-board-view-data';
import { useBoardViewPrefs } from './kanban/hooks/use-board-view-prefs';
import {
  focusCreateTaskInput,
  useFocusCreateTaskInput,
} from './kanban/hooks/use-focus-create-task-input';
import { KanbanDragOverlay } from './kanban/kanban-drag-overlay';
import { SortableKanbanColumn } from './kanban/sortable-kanban-column';
import { TaskDisplayView } from './task-display-views';
import { TaskViewToolbar } from './task-view-toolbar';

const TaskDetailDrawer = dynamic(
  () => import('./task-detail-drawer').then((mod) => ({ default: mod.TaskDetailDrawer })),
  { ssr: false },
);

const BoardWorkloadPanel = dynamic(
  () => import('./board-workload-panel').then((mod) => ({ default: mod.BoardWorkloadPanel })),
  { ssr: false },
);

const BoardSprintPanel = dynamic(
  () => import('./board-sprint-panel').then((mod) => ({ default: mod.BoardSprintPanel })),
  { ssr: false },
);

export function KanbanBoard({
  workspaceId,
  initialTaskId = null,
  initialBoardId = null,
}: {
  workspaceId: string;
  initialTaskId?: string | null;
  initialBoardId?: string | null;
}) {
  const { data: session } = useMeQuery();
  const { data: boards = [], isLoading: boardsLoading } = useBoardsQuery(workspaceId);
  const createBoardMutation = useCreateBoardMutation(workspaceId);
  const [boardId, setBoardId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return initialBoardId;
    return initialBoardId ?? readStoredBoardId(workspaceId);
  });
  const handleBoardChange = useCallback(
    (nextId: string) => {
      setBoardId(nextId);
      storeSelectedBoardId(workspaceId, nextId);
    },
    [workspaceId],
  );
  const { data: board, isLoading } = useBoardQuery(workspaceId, boardId);
  const createColumnMutation = useCreateColumnMutation(workspaceId, boardId ?? '');
  const createTaskMutation = useCreateTaskMutation(workspaceId, boardId);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const openedInitialTaskRef = useRef<string | null>(null);
  const [filters, setFilters] = useState<BoardFilters>(EMPTY_BOARD_FILTERS);

  const {
    viewMode,
    calendarRange,
    viewAnchor,
    setViewMode,
    setCalendarRange,
    setViewAnchor,
    hydrateFromStorage,
  } = useBoardViewPrefs();

  const {
    sensors,
    activeTask,
    activeColumn,
    moveError,
    setMoveError,
    handleDragStart,
    handleDragEnd,
    handleCompleteTask,
  } = useBoardTaskMoves(workspaceId, boardId, board);

  const { filteredColumns, cardFields, memberNames, relationCandidates, orderedTaskIds } =
    useBoardViewData(workspaceId, board, filters, session?.user.id);

  const {
    selectedIds: bulkSelectedIds,
    toggleSelect: handleToggleSelect,
    clear: clearBulk,
  } = useBoardBulkSelection(orderedTaskIds, boardId, viewMode);

  useFocusCreateTaskInput(viewMode, boardId);

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
    hydrateFromStorage(workspaceId);
    setBoardId(initialBoardId ?? readStoredBoardId(workspaceId));
    setFilters(EMPTY_BOARD_FILTERS);
    clearBulk();
  }, [workspaceId, hydrateFromStorage, clearBulk, initialBoardId]);

  const openTaskCount = useMemo(() => {
    if (!board) return 0;
    return board.columns.reduce(
      (sum, column) => sum + Math.max(column.tasks.length, column.taskTotal ?? 0),
      0,
    );
  }, [board]);

  if (boardsLoading) {
    return (
      <>
        <BoardSwitcher
          workspaceId={workspaceId}
          boardId={boardId}
          preferredBoardId={initialBoardId}
          onBoardChange={handleBoardChange}
        />
        <BoardSkeleton />
      </>
    );
  }

  if (boards.length === 0) {
    return (
      <>
        <BoardSwitcher
          workspaceId={workspaceId}
          boardId={boardId}
          preferredBoardId={initialBoardId}
          onBoardChange={handleBoardChange}
        />
        <BoardEmptyState
          className="empty-state--board"
          icon="kanban"
          title="Создайте первую доску"
          description="На доске появятся колонки и задачи — начните с одного пространства для команды."
          actionLabel="Создать доску"
          actionPending={createBoardMutation.isPending}
          onAction={() => {
            void createBoardMutation
              .mutateAsync({ name: 'Основная', templateId: 'kanban' })
              .then((created) => {
                if (created?.id) handleBoardChange(created.id);
              });
          }}
        />
      </>
    );
  }

  if (isLoading || !board || !boardId) {
    return (
      <>
        <BoardSwitcher
          workspaceId={workspaceId}
          boardId={boardId}
          preferredBoardId={initialBoardId}
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
  const showNoColumnsEmpty = viewMode === 'BOARD' && board.columns.length === 0;
  const showNoTasksEmpty = viewMode === 'BOARD' && board.columns.length > 0 && openTaskCount === 0;

  return (
    <>
      <TaskViewToolbar
        mode={viewMode}
        anchor={viewAnchor}
        calendarRange={calendarRange}
        onModeChange={(mode) => {
          setMoveError('');
          setViewMode(workspaceId, mode);
        }}
        onAnchorChange={setViewAnchor}
        onCalendarRangeChange={(range) => {
          setCalendarRange(workspaceId, range);
        }}
      />
      <BoardSwitcher
        workspaceId={workspaceId}
        boardId={boardId}
        preferredBoardId={initialBoardId}
        onBoardChange={handleBoardChange}
      />
      <BoardFiltersBar
        workspaceId={workspaceId}
        boardId={boardId}
        filters={filters}
        onChange={setFilters}
      />
      {board.columns.some((column) => column.truncated) ? (
        <p className="text-sm text-muted-foreground" role="status">
          В некоторых колонках загружена только часть задач — нажмите «Загрузить ещё» внизу колонки.
        </p>
      ) : null}
      {viewMode === 'BOARD' && moveError ? (
        <p className="kanban-board__error" role="alert">
          {moveError}
        </p>
      ) : null}
      {viewMode === 'BOARD' ? (
        <LazyMount eagerMs={150}>
          <BoardWorkloadPanel board={board} />
          <BoardSprintPanel workspaceId={workspaceId} />
        </LazyMount>
      ) : null}
      {viewMode === 'BOARD' ? (
        <BulkActionsToolbar
          workspaceId={workspaceId}
          boardId={boardId}
          columns={board.columns}
          selectedIds={bulkSelectedIds}
          onClear={clearBulk}
        />
      ) : null}

      {viewMode === 'BOARD' ? (
        <ViewModeTransition modeKey="BOARD" className="kanban-board-transition">
          {showNoColumnsEmpty ? (
            <BoardEmptyState
              className="empty-state--board"
              icon="layout-list"
              title="Добавьте первую колонку"
              description="Колонки задают этапы работы — например «К выполнению», «В работе», «Готово»."
              actionLabel="Добавить колонку"
              actionPending={createColumnMutation.isPending}
              onAction={() => {
                void createColumnMutation.mutateAsync('К выполнению');
              }}
            />
          ) : (
            <div className="kanban-board-stack">
              {showNoTasksEmpty ? (
                <BoardEmptyState
                  className="empty-state--board empty-state--overlay"
                  icon="plus"
                  title="На доске пока нет задач"
                  description="Одна задача — и доска оживёт. Можно перетаскивать карточки между колонками."
                  actionLabel="Добавить первую задачу"
                  actionPending={createTaskMutation.isPending}
                  onAction={() => {
                    const firstColumn = board.columns[0];
                    if (!firstColumn) {
                      focusCreateTaskInput();
                      return;
                    }
                    void createTaskMutation.mutateAsync({
                      title: 'Новая задача',
                      columnId: firstColumn.id,
                    });
                  }}
                />
              ) : null}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <div className={`kanban-board${showNoTasksEmpty ? ' kanban-board--dimmed' : ''}`}>
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
                  <KanbanDragOverlay activeColumn={activeColumn} activeTask={activeTask} />
                </DragOverlay>
              </DndContext>
            </div>
          )}
        </ViewModeTransition>
      ) : (
        <ViewModeTransition modeKey={viewMode}>
          <TaskDisplayView
            mode={viewMode as Exclude<typeof viewMode, 'BOARD'>}
            columns={filteredColumns}
            anchor={viewAnchor}
            calendarRange={calendarRange}
            onOpenTask={setSelectedTaskId}
          />
        </ViewModeTransition>
      )}

      {selectedTask ? (
        <TaskDetailDrawer
          key={selectedTask.id}
          workspaceId={workspaceId}
          boardId={boardId}
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
