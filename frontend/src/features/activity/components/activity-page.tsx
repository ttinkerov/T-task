'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useWorkspaceActivityQuery } from '../hooks';

const PAGE_SIZE = 25;

const ACTION_LABELS: Record<string, string> = {
  WORKSPACE_CREATED: 'создал(а) рабочее пространство',
  WORKSPACE_UPDATED: 'изменил(а) настройки пространства',
  WORKSPACE_ARCHIVED: 'архивировал(а) рабочее пространство',
  WORKSPACE_DELETED: 'удалил(а) рабочее пространство',
  MEMBER_JOINED: 'присоединился(-ась) к пространству',
  MEMBER_ROLE_UPDATED: 'изменил(а) роль участника',
  MEMBER_REMOVED: 'удалил(а) участника',
  INVITATION_CREATED: 'создал(а) приглашение',
  INVITATION_REVOKED: 'отозвал(а) приглашение',
  COLUMN_CREATED: 'создал(а) колонку',
  COLUMN_UPDATED: 'переименовал(а) колонку',
  COLUMN_DELETED: 'удалил(а) колонку',
  COLUMN_AUTOMATIONS_UPDATED: 'изменил(а) автоматизации колонки',
  FORM_CREATED: 'создал(а) форму',
  FORM_UPDATED: 'изменил(а) форму',
  FORM_DELETED: 'удалил(а) форму',
  FUNNEL_CREATED: 'создал(а) воронку',
  STAGE_CREATED: 'создал(а) этап воронки',
  STAGE_UPDATED: 'переименовал(а) этап воронки',
  STAGE_DELETED: 'удалил(а) этап воронки',
  APP_CREATED: 'добавил(а) приложение',
  APP_DELETED: 'удалил(а) приложение',
  CALENDAR_FEED_ROTATED: 'создал(а) или обновил(а) ссылку календаря',
  CALENDAR_FEED_REVOKED: 'отключил(а) ссылку календаря',
  TASK_RELATION_CREATED: 'добавил(а) связь задачи',
  TASK_RELATION_DELETED: 'удалил(а) связь задачи',
  CUSTOM_FIELD_CREATED: 'создал(а) кастомное поле',
  CUSTOM_FIELD_UPDATED: 'изменил(а) кастомное поле',
  CUSTOM_FIELD_DELETED: 'удалил(а) кастомное поле',
  TASK_RESTORED: 'восстановил(а) задачу из корзины',
  TASK_PURGED: 'удалил(а) задачу навсегда',
  DEAL_RESTORED: 'восстановил(а) сделку из корзины',
  DEAL_PURGED: 'удалил(а) сделку навсегда',
  APP_RESTORED: 'восстановил(а) приложение из корзины',
  APP_PURGED: 'удалил(а) приложение навсегда',
  AI_SETTINGS_UPDATED: 'обновил(а) настройки ИИ',
  AI_SETTINGS_DELETED: 'удалил(а) токен ИИ',
  AI_EPIC_BREAKDOWN_APPLIED: 'разбил(а) эпик на задачи с ИИ',
};

export function ActivityPage({ workspaceId }: { workspaceId: string }) {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const listRef = useRef<HTMLOListElement>(null);
  const filters = useMemo(
    () => ({
      ...(action ? { action } : {}),
      ...(from ? { from: new Date(from).toISOString() } : {}),
      ...(to ? { to: new Date(`${to}T23:59:59.999`).toISOString() } : {}),
    }),
    [action, from, to],
  );
  const query = useWorkspaceActivityQuery(workspaceId, page, PAGE_SIZE, filters);
  const result = query.data;
  const totalPages = Math.max(1, Math.ceil((result?.total ?? 0) / PAGE_SIZE));
  const statusMessage = query.isLoading
    ? 'Загрузка журнала…'
    : query.isFetching
      ? `Страница ${page} из ${totalPages} загружается`
      : result
        ? `Страница ${page} из ${totalPages} загружена`
        : '';

  useEffect(() => {
    setPage(1);
  }, [action, from, to]);

  useEffect(() => {
    if (!query.isFetching && result?.items.length) {
      listRef.current?.focus();
    }
  }, [page, query.isFetching, result?.items.length]);

  return (
    <section className="activity-page" aria-labelledby="activity-page-title">
      <header className="activity-page__header">
        <span>Рабочее пространство</span>
        <h1 id="activity-page-title">Журнал аудита</h1>
        <p>История административных событий. Фильтруйте по действию и дате.</p>
      </header>

      <div className="analytics-filters" style={{ marginBottom: '1rem' }}>
        <label className="analytics-filters__group">
          <span className="analytics-filters__label">Действие</span>
          <select
            className="board-filters__select"
            value={action}
            onChange={(event) => setAction(event.target.value)}
          >
            <option value="">Все</option>
            {Object.keys(ACTION_LABELS).map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
        </label>
        <label className="analytics-filters__group">
          <span className="analytics-filters__label">С</span>
          <input
            type="date"
            className="glass-input"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label className="analytics-filters__group">
          <span className="analytics-filters__label">По</span>
          <input
            type="date"
            className="glass-input"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
      </div>

      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {statusMessage}
      </p>

      {query.isLoading ? (
        <p className="activity-page__state" role="status" aria-live="polite" aria-atomic="true">
          Загрузка журнала…
        </p>
      ) : query.error ? (
        <p className="activity-page__error" role="alert">
          Не удалось загрузить журнал. Попробуйте обновить страницу.
        </p>
      ) : result?.items.length ? (
        <>
          <ol
            ref={listRef}
            className="activity-list"
            tabIndex={-1}
            aria-label="Записи журнала действий"
          >
            {result.items.map((entry) => {
              const actorName = entry.actorName.trim() || 'Удалённый пользователь';

              return (
                <li key={entry.id} className="activity-list__item">
                  <span className="activity-list__avatar" aria-hidden="true">
                    {actorName.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="activity-list__content">
                    <p>
                      <strong>{actorName}</strong>{' '}
                      {ACTION_LABELS[entry.action] ?? 'выполнил(а) действие'}
                      {entry.entityName ? (
                        <span className="activity-list__entity"> «{entry.entityName}»</span>
                      ) : null}
                    </p>
                    <time dateTime={new Date(entry.createdAt).toISOString()}>
                      {new Intl.DateTimeFormat('ru-RU', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      }).format(new Date(entry.createdAt))}
                    </time>
                  </div>
                </li>
              );
            })}
          </ol>

          <nav
            className="activity-pagination"
            aria-label="Страницы журнала действий"
            aria-busy={query.isFetching}
          >
            <button
              type="button"
              className="btn-ghost"
              disabled={page <= 1 || query.isFetching}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              ← Назад
            </button>
            <span aria-hidden="true">
              Страница {page} из {totalPages}
            </span>
            <button
              type="button"
              className="btn-ghost"
              disabled={page >= totalPages || query.isFetching}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            >
              Далее →
            </button>
          </nav>
        </>
      ) : (
        <div className="activity-page__empty">
          <span aria-hidden="true" role="presentation">
            ↻
          </span>
          <h2>Событий пока нет</h2>
          <p>Новые административные действия появятся здесь автоматически.</p>
        </div>
      )}
    </section>
  );
}
