'use client';

import { DndContext, DragOverlay, closestCorners } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BoardSkeleton } from '@/components/ui/skeleton';
import { useMeQuery } from '@/features/auth/hooks';
import { BulkActionsToolbar } from './bulk-actions-toolbar';
import { findTask } from '../lib/board-lookup';
import { useBoardQuery } from '../hooks';
import { EMPTY_BOARD_FILTERS, type BoardFilters } from '../types';
import { BoardFiltersBar } from './board-filters-bar';
import { BoardSprintPanel } from './board-sprint-panel';
import { BoardSwitcher, storeSelectedBoardId } from './board-switcher';
import { BoardWorkloadPanel } from './board-workload-panel';
import { AddColumnPanel } from './kanban/add-column-panel';
import { useBoardBulkSelection } from './kanban/hooks/use-board-bulk-selection';
import { useBoardTaskMoves } from './kanban/hooks/use-board-task-moves';
import { useBoardViewData } from './kanban/hooks/use-board-view-data';
import { useBoardViewPrefs } from './kanban/hooks/use-board-view-prefs';
import { useFocusCreateTaskInput } from './kanban/hooks/use-focus-create-task-input';
import { KanbanDragOverlay } from './kanban/kanban-drag-overlay';
import { SortableKanbanColumn } from './kanban/sortable-kanban-column';
import { TaskDisplayView, TaskViewToolbar } from './task-display-views';

const TaskDetailDrawer = dynamic(
  () => import('./task-detail-drawer').then((mod) => ({ default: mod.TaskDetailDrawer })),
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
  const [boardId, setBoardId] = useState<string | null>(null);
  const handleBoardChange = useCallback(
    (nextId: string) => {
      setBoardId(nextId);
      storeSelectedBoardId(workspaceId, nextId);
    },
    [workspaceId],
  );
  const { data: board, isLoading } = useBoardQuery(workspaceId, boardId);
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
    setBoardId(null);
    setFilters(EMPTY_BOARD_FILTERS);
    clearBulk();
  }, [workspaceId, hydrateFromStorage, clearBulk]);

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
      {viewMode === 'BOARD' ? <BoardWorkloadPanel board={board} /> : null}
      {viewMode === 'BOARD' ? <BoardSprintPanel workspaceId={workspaceId} /> : null}
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
            <KanbanDragOverlay activeColumn={activeColumn} activeTask={activeTask} />
          </DragOverlay>
        </DndContext>
      ) : (
        <TaskDisplayView
          mode={viewMode as Exclude<typeof viewMode, 'BOARD'>}
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
