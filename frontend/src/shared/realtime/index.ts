'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, type Socket } from 'socket.io-client';
import { boardKeys } from '@/features/boards/hooks';
import { getRealtimeBaseUrl } from '@/shared/lib/env';

type RealtimePayload = {
  workspaceId?: string;
  boardId?: string;
  taskId?: string;
};

export function useWorkspaceRealtime(workspaceId: string | null) {
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

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
    let allTasksTimer: number | null = null;

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

    const invalidateAllTasks = () => {
      if (allTasksTimer) window.clearTimeout(allTasksTimer);
      allTasksTimer = window.setTimeout(() => {
        allTasksTimer = null;
        void queryClient.invalidateQueries({
          queryKey: ['all-tasks', workspaceId],
        });
      }, 800);
    };

    const onTaskBoardEvent = (payload: RealtimePayload) => {
      invalidateBoard(payload.boardId);
      invalidateAllTasks();
      invalidateNotifications();
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

    socket.on('task.moved', onTaskBoardEvent);
    socket.on('task.assigned', onTaskBoardEvent);
    socket.on('comment.created', onCommentCreated);

    return () => {
      for (const timer of boardTimers.values()) window.clearTimeout(timer);
      boardTimers.clear();
      if (notificationsTimer) window.clearTimeout(notificationsTimer);
      if (allTasksTimer) window.clearTimeout(allTasksTimer);
      socket.off('task.moved', onTaskBoardEvent);
      socket.off('task.assigned', onTaskBoardEvent);
      socket.off('comment.created', onCommentCreated);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [queryClient, workspaceId]);
}
