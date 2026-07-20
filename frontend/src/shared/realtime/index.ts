'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, type Socket } from 'socket.io-client';
import { getApiBaseUrl } from '@/shared/lib/env';

const REALTIME_EVENTS = ['task.moved', 'task.assigned', 'comment.created'] as const;

export function useWorkspaceRealtime(workspaceId: string | null) {
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!workspaceId) return;

    const baseUrl = getApiBaseUrl().replace(/\/$/, '');
    const socket = io(baseUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('workspace:join', { workspaceId });
    });

    let timer: number | null = null;
    const invalidate = () => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        void queryClient.invalidateQueries({ queryKey: ['boards'] });
        void queryClient.invalidateQueries({ queryKey: ['notifications'] });
        void queryClient.invalidateQueries({ queryKey: ['all-tasks'] });
      }, 250);
    };

    for (const event of REALTIME_EVENTS) {
      socket.on(event, invalidate);
    }

    return () => {
      if (timer) window.clearTimeout(timer);
      for (const event of REALTIME_EVENTS) {
        socket.off(event, invalidate);
      }
      socket.disconnect();
      socketRef.current = null;
    };
  }, [queryClient, workspaceId]);
}
