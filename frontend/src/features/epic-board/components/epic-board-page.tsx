'use client';

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import {
  EMPTY_ALL_TASKS_FILTERS,
  useAllTasksMetaQuery,
  useAllTasksQuery,
  type AllTask,
} from '@/features/all-tasks';
import { useMoveTaskMutation } from '@/features/boards/hooks';
import EpicBoardStatusView from '@/vue/epic-board/EpicBoardStatus.vue';
import EpicBoardToolbarView from '@/vue/epic-board/EpicBoardToolbar.vue';
import EpicStickyOverlayView from '@/vue/epic-board/EpicStickyOverlay.vue';
import { EpicStickyColumn } from './epic-sticky-column';
import { buildEpicStickyLanes, stickyColorForTask } from '../lib/epic-sticky-lanes';

const TaskDetailDrawer = dynamic(
  () =>
    import('@/features/boards/components/task-detail-drawer').then((mod) => ({
      default: mod.TaskDetailDrawer,
    })),
  { ssr: false },
);

const EPICS_QUERY = {
  ...EMPTY_ALL_TASKS_FILTERS,
  isEpic: true,
  page: 1,
  limit: 100,
  sortBy: 'UPDATED_AT' as const,
  sortOrder: 'DESC' as const,
};

export function EpicBoardPage({
  workspaceId,
  initialEpicId = null,
  initialTaskId = null,
}: {
  workspaceId: string;
  initialEpicId?: string | null;
  initialTaskId?: string | null;
}) {
  const [epicId, setEpicId] = useState<string | null>(initialEpicId);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<AllTask | null>(null);
  const [moveError, setMoveError] = useState('');

  const epicsQuery = useAllTasksQuery(workspaceId, EPICS_QUERY);
  const epics = epicsQuery.data?.items ?? [];
  const selectedEpic = epics.find((epic) => epic.id === epicId) ?? null;

  const childrenQuery = useAllTasksQuery(epicId ? workspaceId : null, {
    ...EMPTY_ALL_TASKS_FILTERS,
    epicId: epicId ?? '',
    page: 1,
    limit: 100,
    sortBy: 'UPDATED_AT',
    sortOrder: 'DESC',
  });
  const children = childrenQuery.data?.items ?? [];

  const metaQuery = useAllTasksMetaQuery(workspaceId);
  const boardColumns =
    metaQuery.data?.boards.find((board) => board.id === selectedEpic?.board.id)?.columns ?? [];

  const moveMutation = useMoveTaskMutation(workspaceId, selectedEpic?.board.id ?? '');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    if (initialEpicId) setEpicId(initialEpicId);
  }, [initialEpicId]);

  useEffect(() => {
    if (!epicId && epics.length > 0) {
      setEpicId(epics[0]!.id);
    }
  }, [epicId, epics]);

  useEffect(() => {
    if (!initialTaskId) return;
    if (children.some((task) => task.id === initialTaskId)) {
      setSelectedTaskId(initialTaskId);
    }
  }, [initialTaskId, children]);

  const { lanes, foreignCount } = useMemo(() => {
    if (!selectedEpic) return { lanes: [], foreignCount: 0 };
    return buildEpicStickyLanes(boardColumns, children, selectedEpic.board.id);
  }, [boardColumns, children, selectedEpic]);

  const relationCandidates = useMemo(
    () =>
      children.map((task) => ({
        id: task.id,
        title: task.title,
        columnName: task.column.name,
        completed: Boolean(task.completedAt),
        isEpic: Boolean(task.isEpic),
      })),
    [children],
  );

  const selectedTask =
    selectedTaskId != null
      ? (children.find((task) => task.id === selectedTaskId) ??
        (selectedEpic?.id === selectedTaskId ? selectedEpic : null))
      : null;

  const handleDragStart = (event: DragStartEvent) => {
    setMoveError('');
    const task = children.find((item) => item.id === String(event.active.id));
    setActiveTask(task ?? null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over || !selectedEpic) return;

    const taskId = String(active.id);
    const overId = String(over.id);
    const task = children.find((item) => item.id === taskId);
    if (!task || task.board.id !== selectedEpic.board.id) return;

    const targetColumnId = boardColumns.some((column) => column.id === overId)
      ? overId
      : children.find((item) => item.id === overId)?.columnId;
    if (!targetColumnId || task.columnId === targetColumnId) return;

    const lane = lanes.find((item) => item.column.id === targetColumnId);
    const position = lane?.tasks.length ?? 0;

    try {
      await moveMutation.mutateAsync({
        taskId,
        columnId: targetColumnId,
        position,
      });
      await childrenQuery.refetch();
    } catch (error) {
      setMoveError(error instanceof Error ? error.message : 'Не удалось переместить стикер');
    }
  };

  const onEpicChange = useCallback((nextId: string | null) => {
    setEpicId(nextId);
  }, []);

  const epicOptions = useMemo(
    () => epics.map((epic) => ({ id: epic.id, title: epic.title })),
    [epics],
  );

  const toolbarProps = useMemo(
    () => ({
      epicId: epicId ?? '',
      epics: epicOptions,
      pickerDisabled: epicsQuery.isLoading || epics.length === 0,
      onEpicChange,
    }),
    [epicId, epicOptions, epicsQuery.isLoading, epics.length, onEpicChange],
  );

  const boardStatus = epicsQuery.isError
    ? 'load-error'
    : epicsQuery.isLoading
      ? 'loading-epics'
      : epics.length === 0
        ? 'no-epics'
        : childrenQuery.isError
          ? 'load-error'
          : childrenQuery.isLoading
            ? 'loading-children'
            : 'ready';

  const statusProps = useMemo(
    () => ({
      status: boardStatus,
      boardName: selectedEpic?.board.name ?? '',
      foreignCount,
      moveError,
      loadError:
        (epicsQuery.error instanceof Error
          ? epicsQuery.error.message
          : childrenQuery.error instanceof Error
            ? childrenQuery.error.message
            : '') || 'Не удалось загрузить доску эпиков',
      onRetryLoad: () => {
        void epicsQuery.refetch();
        void childrenQuery.refetch();
      },
    }),
    [
      boardStatus,
      selectedEpic?.board.name,
      foreignCount,
      moveError,
      epicsQuery.error,
      epicsQuery.refetch,
      childrenQuery.error,
      childrenQuery.refetch,
    ],
  );

  const overlayProps = useMemo(
    () =>
      activeTask
        ? {
            title: activeTask.title,
            background: stickyColorForTask(activeTask.id),
          }
        : null,
    [activeTask],
  );

  return (
    <div className="epic-board">
      <VueIsland component={EpicBoardToolbarView} componentProps={toolbarProps} />
      <VueIsland component={EpicBoardStatusView} componentProps={statusProps} />

      {boardStatus === 'ready' ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="epic-board__lanes">
            {lanes.map((lane) => (
              <EpicStickyColumn
                key={lane.column.id}
                columnId={lane.column.id}
                name={lane.column.name}
                tasks={lane.tasks}
                onOpenTask={setSelectedTaskId}
              />
            ))}
          </div>
          <DragOverlay>
            {overlayProps ? (
              <VueIsland component={EpicStickyOverlayView} componentProps={overlayProps} />
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : null}

      {boardStatus === 'ready' && lanes.every((lane) => lane.tasks.length === 0) ? (
        <p className="epic-board__empty">
          У эпика пока нет задач на этой доске. Привяжите задачи через поле «Эпик».
        </p>
      ) : null}

      {selectedTask ? (
        <TaskDetailDrawer
          key={selectedTask.id}
          workspaceId={workspaceId}
          task={selectedTask}
          columnName={selectedTask.column.name}
          relationCandidates={relationCandidates}
          onOpenTask={setSelectedTaskId}
          onClose={() => setSelectedTaskId(null)}
        />
      ) : null}
    </div>
  );
}
