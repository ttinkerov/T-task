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
import { useEffect, useMemo, useState } from 'react';
import {
  EMPTY_ALL_TASKS_FILTERS,
  useAllTasksMetaQuery,
  useAllTasksQuery,
  type AllTask,
} from '@/features/all-tasks';
import { useMoveTaskMutation } from '@/features/boards/hooks';
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

  return (
    <div className="epic-board">
      <header className="epic-board__toolbar">
        <div>
          <p className="epic-board__eyebrow">Эпик-борд</p>
          <h1 className="epic-board__title">Стикеры по статусам</h1>
        </div>
        <label className="epic-board__epic-picker">
          <span>Эпик</span>
          <select
            className="glass-input"
            value={epicId ?? ''}
            onChange={(event) => setEpicId(event.target.value || null)}
            disabled={epicsQuery.isLoading || epics.length === 0}
          >
            {epics.length === 0 ? <option value="">Нет эпиков</option> : null}
            {epics.map((epic) => (
              <option key={epic.id} value={epic.id}>
                {epic.title}
              </option>
            ))}
          </select>
        </label>
      </header>

      {epicsQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Загружаем эпики…</p>
      ) : epics.length === 0 ? (
        <p className="epic-board__empty">
          Отметьте задачу как эпик в карточке — здесь появятся её стикеры.
        </p>
      ) : childrenQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Загружаем задачи эпика…</p>
      ) : (
        <>
          {selectedEpic ? (
            <p className="epic-board__subtitle">
              Доска «{selectedEpic.board.name}» · перетащите стикер между колонками
            </p>
          ) : null}
          {foreignCount > 0 ? (
            <p className="epic-board__note" role="status">
              Ещё {foreignCount} задач(и) эпика на других досках — здесь только текущая доска.
            </p>
          ) : null}
          {moveError ? (
            <p className="epic-board__error" role="alert">
              {moveError}
            </p>
          ) : null}

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
              {activeTask ? (
                <div
                  className="epic-sticky epic-sticky--overlay"
                  style={{ background: stickyColorForTask(activeTask.id) }}
                >
                  <span className="epic-sticky__title">{activeTask.title}</span>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>

          {lanes.every((lane) => lane.tasks.length === 0) ? (
            <p className="epic-board__empty">
              У эпика пока нет задач на этой доске. Привяжите задачи через поле «Эпик».
            </p>
          ) : null}
        </>
      )}

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
