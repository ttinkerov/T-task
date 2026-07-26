'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, type Socket } from 'socket.io-client';
import { useMeQuery } from '@/features/auth/hooks';
import { applyOptimisticMoveTask, boardKeys } from '@/features/boards/hooks';
import type { BoardView } from '@/features/boards/types';
import { getRealtimeBaseUrl } from '@/shared/lib/env';

type RealtimePayload = {
  workspaceId?: string;
  boardId?: string;
  taskId?: string;
  columnId?: string;
  position?: number;
  actorId?: string;
  assigneeId?: string | null;
};

export function useWorkspaceRealtime(workspaceId: string | null) {
  const queryClient = useQueryClient();
  const { data: me } = useMeQuery(Boolean(workspaceId));
  const socketRef = useRef<Socket | null>(null);
  const actorIdRef = useRef<string | null>(null);
  actorIdRef.current = me?.user?.id ?? null;

  useEffect(() => {
    if (!workspaceId) return;

    const baseUrl = getRealtimeBaseUrl();
    const socket = io(baseUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('workspace:join', { workspaceId });
    });

    const boardTimers = new Map<string, number>();
    let notificationsTimer: number | null = null;

    const schedule = (key: string, map: Map<string, number>, run: () => void) => {
      const existing = map.get(key);
      if (existing) window.clearTimeout(existing);
      map.set(
        key,
        window.setTimeout(() => {
          map.delete(key);
          run();
        }, 800),
      );
    };

    const invalidateBoard = (boardId?: string) => {
      if (boardId) {
        schedule(boardId, boardTimers, () => {
          void queryClient.invalidateQueries({
            queryKey: boardKeys.detail(workspaceId, boardId),
          });
        });
        return;
      }
      schedule('workspace', boardTimers, () => {
        void queryClient.invalidateQueries({
          queryKey: boardKeys.workspace(workspaceId),
        });
      });
    };

    const invalidateNotifications = () => {
      if (notificationsTimer) window.clearTimeout(notificationsTimer);
      notificationsTimer = window.setTimeout(() => {
        notificationsTimer = null;
        void queryClient.invalidateQueries({ queryKey: ['notifications'] });
      }, 800);
    };

    const patchMovedTask = (payload: RealtimePayload) => {
      if (
        !payload.boardId ||
        !payload.taskId ||
        !payload.columnId ||
        typeof payload.position !== 'number'
      ) {
        invalidateBoard(payload.boardId);
        return;
      }

      const key = boardKeys.detail(workspaceId, payload.boardId);
      const current = queryClient.getQueryData<BoardView>(key);
      if (!current) {
        invalidateBoard(payload.boardId);
        return;
      }

      queryClient.setQueryData(
        key,
        applyOptimisticMoveTask(current, payload.taskId, payload.columnId, payload.position),
      );
    };

    const onTaskMoved = (payload: RealtimePayload) => {
      if (payload.actorId && payload.actorId === actorIdRef.current) {
        return;
      }
      patchMovedTask(payload);
    };

    const onTaskAssigned = (payload: RealtimePayload) => {
      if (payload.actorId && payload.actorId === actorIdRef.current) {
        return;
      }
      invalidateBoard(payload.boardId);
    };

    const onCommentCreated = (payload: RealtimePayload) => {
      if (payload.taskId) {
        void queryClient.invalidateQueries({
          queryKey: boardKeys.comments(workspaceId, payload.taskId),
        });
        void queryClient.invalidateQueries({
          queryKey: boardKeys.task(workspaceId, payload.taskId),
        });
      }
      invalidateNotifications();
    };

    socket.on('task.moved', onTaskMoved);
    socket.on('task.assigned', onTaskAssigned);
    socket.on('comment.created', onCommentCreated);

    return () => {
      for (const timer of boardTimers.values()) window.clearTimeout(timer);
      boardTimers.clear();
      if (notificationsTimer) window.clearTimeout(notificationsTimer);
      socket.off('task.moved', onTaskMoved);
      socket.off('task.assigned', onTaskAssigned);
      socket.off('comment.created', onCommentCreated);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [queryClient, workspaceId]);
}
