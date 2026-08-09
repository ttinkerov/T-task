'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { VueIsland } from '@/components/vue/VueIsland';
import NotificationBellView from '@/vue/shell/NotificationBell.vue';
import {
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsQuery,
} from '../hooks';
import type { AppNotification } from '../types';

export function NotificationBell({ workspaceId }: { workspaceId: string | null }) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const notificationsQuery = useNotificationsQuery(workspaceId);
  const markReadMutation = useMarkNotificationReadMutation(workspaceId ?? '');
  const markAllMutation = useMarkAllNotificationsReadMutation(workspaceId ?? '');
  const inbox = notificationsQuery.data;

  useEffect(() => {
    if (!open) return;

    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  const onToggle = useCallback(() => setOpen((current) => !current), []);
  const onMarkAll = useCallback(() => markAllMutation.mutate(), [markAllMutation]);

  const onOpen = useCallback(
    async (notificationId: string) => {
      if (!workspaceId || !inbox) return;
      const notification = inbox.items.find((item) => item.id === notificationId);
      if (!notification) return;
      if (!notification.read) {
        try {
          await markReadMutation.mutateAsync(notification.id);
        } catch {
          /* navigation is more important than mark-read */
        }
      }
      setOpen(false);
      router.push(`/dashboard/board?task=${encodeURIComponent(notification.task.id)}`);
    },
    [inbox, markReadMutation, router, workspaceId],
  );

  const items = useMemo(
    () =>
      (inbox?.items ?? []).map((notification) => {
        const copy = notificationCopy(notification);
        return {
          id: notification.id,
          read: notification.read,
          avatar: actorInitial(notification),
          actorName: copy.actorName,
          actionText: copy.actionText,
          taskTitle: notification.task.title,
          preview: notification.preview,
          createdAt: notification.createdAt,
          timeLabel: new Date(notification.createdAt).toLocaleString('ru-RU', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          }),
        };
      }),
    [inbox?.items],
  );

  const viewProps = useMemo(
    () => ({
      enabled: Boolean(workspaceId),
      open,
      unreadCount: inbox?.unreadCount ?? 0,
      isLoading: notificationsQuery.isLoading,
      error: Boolean(notificationsQuery.error),
      markAllPending: markAllMutation.isPending,
      items,
      ariaLabel: inbox?.unreadCount
        ? `Уведомления: ${inbox.unreadCount} непрочитанных`
        : 'Уведомления',
      onToggle,
      onMarkAll,
      onOpen,
    }),
    [
      workspaceId,
      open,
      inbox?.unreadCount,
      notificationsQuery.isLoading,
      notificationsQuery.error,
      markAllMutation.isPending,
      items,
      onToggle,
      onMarkAll,
      onOpen,
    ],
  );

  return (
    <div ref={rootRef}>
      <VueIsland component={NotificationBellView} componentProps={viewProps} />
    </div>
  );
}

function actorInitial(notification: AppNotification) {
  if (notification.type === 'DUE_REMINDER' || !notification.actor) {
    return '⏱';
  }
  if (notification.type === 'WATCH') {
    return '👁';
  }
  return notification.actor.name.slice(0, 1).toUpperCase() || '?';
}

function notificationCopy(notification: AppNotification) {
  if (notification.type === 'DUE_REMINDER') {
    return { actorName: 'Система', actionText: ' напоминает о сроке' };
  }

  if (notification.type === 'WATCH') {
    return {
      actorName: notification.actor?.name ?? 'Кто-то',
      actionText: ' · обновление по задаче, за которой вы следите',
    };
  }

  const sourceLabel =
    notification.sourceType === 'COMMENT'
      ? ' в комментарии'
      : notification.sourceType === 'TASK_DESCRIPTION'
        ? ' в описании задачи'
        : '';

  return {
    actorName: notification.actor?.name ?? 'Система',
    actionText: ` упоминает вас${sourceLabel}`,
  };
}
