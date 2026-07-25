'use client';

import {
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useCallback, useState } from 'react';
import { celebrateTaskComplete } from '@/shared/lib/celebrate';
import type { DragType } from '../../../lib/board-drag-drop';
import { resolveDropTarget } from '../../../lib/board-drag-drop';
import { findDoneColumn, findTask } from '../../../lib/board-lookup';
import { useMoveColumnMutation, useMoveTaskMutation } from '../../../hooks';
import type { BoardColumn, BoardTask, BoardView } from '../../../types';

export function useBoardTaskMoves(
  workspaceId: string,
  boardId: string | null,
  board: BoardView | null | undefined,
) {
  const moveTaskMutation = useMoveTaskMutation(workspaceId, boardId ?? '');
  const moveColumnMutation = useMoveColumnMutation(workspaceId, boardId ?? '');
  const [activeTask, setActiveTask] = useState<BoardTask | null>(null);
  const [activeColumn, setActiveColumn] = useState<BoardColumn | null>(null);
  const [moveError, setMoveError] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
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

  return {
    sensors,
    activeTask,
    activeColumn,
    moveError,
    setMoveError,
    handleDragStart,
    handleDragEnd,
    handleCompleteTask,
  };
}
