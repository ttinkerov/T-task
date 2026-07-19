'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
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

  const openNotification = async (notification: AppNotification) => {
    if (!workspaceId) return;
    if (!notification.read) {
      await markReadMutation.mutateAsync(notification.id);
    }
    setOpen(false);
    router.push(`/dashboard/board?task=${encodeURIComponent(notification.task.id)}`);
  };

  return (
    <div className="notification-bell" ref={rootRef}>
      <button
        type="button"
        className="dashboard-header__icon-btn notification-bell__trigger"
        onClick={() => setOpen((current) => !current)}
        disabled={!workspaceId}
        aria-label={
          inbox?.unreadCount ? `Уведомления: ${inbox.unreadCount} непрочитанных` : 'Уведомления'
        }
        aria-expanded={open}
        aria-controls="notification-inbox"
      >
        <span aria-hidden="true">🔔</span>
        {inbox?.unreadCount ? (
          <span className="notification-bell__count" aria-hidden="true">
            {inbox.unreadCount > 99 ? '99+' : inbox.unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <section
          id="notification-inbox"
          className="notification-bell__panel"
          aria-label="Уведомления"
        >
          <header>
            <h2>Уведомления</h2>
            {inbox?.unreadCount ? (
              <button
                type="button"
                onClick={() => markAllMutation.mutate()}
                disabled={markAllMutation.isPending}
              >
                Прочитать все
              </button>
            ) : null}
          </header>

          {notificationsQuery.isLoading ? (
            <p className="notification-bell__empty" role="status">
              Загрузка…
            </p>
          ) : notificationsQuery.error ? (
            <p className="notification-bell__error" role="alert">
              Не удалось загрузить уведомления.
            </p>
          ) : !inbox?.items.length ? (
            <p className="notification-bell__empty">Здесь пока ничего нет</p>
          ) : (
            <ul className="notification-bell__list" role="list">
              {inbox.items.map((notification) => (
                <li key={notification.id}>
                  <button
                    type="button"
                    className={notification.read ? undefined : 'notification-bell__item--unread'}
                    onClick={() => void openNotification(notification)}
                  >
                    <span className="notification-bell__avatar" aria-hidden="true">
                      {actorInitial(notification)}
                    </span>
                    <span>
                      <NotificationCopy notification={notification} />
                      <small>{notification.task.title}</small>
                      <em>{notification.preview}</em>
                      <time dateTime={notification.createdAt}>
                        {new Date(notification.createdAt).toLocaleString('ru-RU', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </time>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}

function actorInitial(notification: AppNotification) {
  if (notification.type === 'DUE_REMINDER' || !notification.actor) {
    return '⏱';
  }
  return notification.actor.name.slice(0, 1).toUpperCase() || '?';
}

function NotificationCopy({ notification }: { notification: AppNotification }) {
  if (notification.type === 'DUE_REMINDER') {
    return (
      <>
        <strong>Система</strong> напоминает о сроке
      </>
    );
  }

  const actorName = notification.actor?.name ?? 'Система';
  const sourceLabel =
    notification.sourceType === 'COMMENT'
      ? 'в комментарии'
      : notification.sourceType === 'TASK_DESCRIPTION'
        ? 'в описании задачи'
        : '';

  return (
    <>
      <strong>{actorName}</strong> упоминает вас{sourceLabel ? ` ${sourceLabel}` : ''}
    </>
  );
}
