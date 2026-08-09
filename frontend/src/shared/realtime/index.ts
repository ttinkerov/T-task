'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, type Socket } from 'socket.io-client';
import { useMeQuery } from '@/features/auth/hooks';
import { applyOptimisticMoveTask, boardKeys } from '@/features/boards/hooks';
import type { BoardView } from '@/features/boards/types';
import { crmKeys, optimisticMoveDeal } from '@/features/crm/hooks';
import type { FunnelView } from '@/features/crm/types';
import { getRealtimeBaseUrl } from '@/shared/lib/env';

type RealtimePayload = {
  workspaceId?: string;
  boardId?: string;
  taskId?: string;
  columnId?: string;
  position?: number;
  actorId?: string;
  assigneeId?: string | null;
  funnelId?: string;
  dealId?: string;
  stageId?: string;
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
    const funnelTimers = new Map<string, number>();
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

    const invalidateFunnel = (funnelId?: string) => {
      if (funnelId) {
        schedule(funnelId, funnelTimers, () => {
          void queryClient.invalidateQueries({
            queryKey: crmKeys.funnel(workspaceId, funnelId),
          });
        });
        return;
      }
      schedule('crm', funnelTimers, () => {
        void queryClient.invalidateQueries({ queryKey: crmKeys.funnels(workspaceId) });
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

    const patchMovedDeal = (payload: RealtimePayload) => {
      if (
        !payload.funnelId ||
        !payload.dealId ||
        !payload.stageId ||
        typeof payload.position !== 'number'
      ) {
        invalidateFunnel(payload.funnelId);
        return;
      }

      const key = crmKeys.funnel(workspaceId, payload.funnelId);
      const current = queryClient.getQueryData<FunnelView>(key);
      if (!current) {
        invalidateFunnel(payload.funnelId);
        return;
      }

      queryClient.setQueryData(
        key,
        optimisticMoveDeal(current, payload.dealId, payload.stageId, payload.position),
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

    const onDealCreated = (payload: RealtimePayload) => {
      if (payload.actorId && payload.actorId === actorIdRef.current) {
        return;
      }
      invalidateFunnel(payload.funnelId);
    };

    const onDealMoved = (payload: RealtimePayload) => {
      if (payload.actorId && payload.actorId === actorIdRef.current) {
        return;
      }
      patchMovedDeal(payload);
    };

    socket.on('task.moved', onTaskMoved);
    socket.on('task.assigned', onTaskAssigned);
    socket.on('comment.created', onCommentCreated);
    socket.on('deal.created', onDealCreated);
    socket.on('deal.moved', onDealMoved);

    return () => {
      for (const timer of boardTimers.values()) window.clearTimeout(timer);
      boardTimers.clear();
      for (const timer of funnelTimers.values()) window.clearTimeout(timer);
      funnelTimers.clear();
      if (notificationsTimer) window.clearTimeout(notificationsTimer);
      socket.off('task.moved', onTaskMoved);
      socket.off('task.assigned', onTaskAssigned);
      socket.off('comment.created', onCommentCreated);
      socket.off('deal.created', onDealCreated);
      socket.off('deal.moved', onDealMoved);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [queryClient, workspaceId]);
}
