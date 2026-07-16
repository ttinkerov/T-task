'use client';

import { useEffect, useRef, useState } from 'react';
import {
  useCanManageTrash,
  usePurgeTrashItemMutation,
  useRestoreTrashItemMutation,
  useWorkspaceTrashQuery,
} from '../hooks';
import type { TrashEntityType, TrashItem } from '../types';

const PAGE_SIZE = 25;

const TYPE_LABELS: Record<TrashEntityType, string> = {
  TASK: 'Задача',
  DEAL: 'Сделка',
  APP: 'Приложение',
};

function formatDeletedAt(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function TrashPage({ workspaceId }: { workspaceId: string }) {
  const [page, setPage] = useState(1);
  const listRef = useRef<HTMLUListElement>(null);
  const { canPurge } = useCanManageTrash();
  const query = useWorkspaceTrashQuery(workspaceId, page, PAGE_SIZE);
  const restoreMutation = useRestoreTrashItemMutation(workspaceId);
  const purgeMutation = usePurgeTrashItemMutation(workspaceId);
  const result = query.data;
  const totalPages = Math.max(1, Math.ceil((result?.total ?? 0) / PAGE_SIZE));
  const busyKey =
    restoreMutation.isPending || purgeMutation.isPending
      ? `${restoreMutation.variables?.entityType ?? purgeMutation.variables?.entityType}:${restoreMutation.variables?.entityId ?? purgeMutation.variables?.entityId}`
      : null;

  useEffect(() => {
    if (!query.isFetching && result?.items.length) {
      listRef.current?.focus();
    }
  }, [page, query.isFetching, result?.items.length]);

  const handleRestore = (item: TrashItem) => {
    restoreMutation.mutate({ entityType: item.entityType, entityId: item.entityId });
  };

  const handlePurge = (item: TrashItem) => {
    const confirmed = window.confirm(
      `Удалить «${item.entityName}» навсегда? Это действие нельзя отменить.`,
    );
    if (!confirmed) {
      return;
    }

    purgeMutation.mutate({ entityType: item.entityType, entityId: item.entityId });
  };

  return (
    <section className="trash-page" aria-labelledby="trash-page-title">
      <header className="trash-page__header">
        <span>Рабочее пространство</span>
        <h1 id="trash-page-title">Общая корзина</h1>
        <p>
          Восстанавливайте удалённые задачи, сделки и приложения. Постоянное удаление доступно
          только владельцу пространства.
        </p>
      </header>

      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {query.isLoading ? 'Загрузка корзины…' : result ? `Страница ${page} из ${totalPages}` : ''}
      </p>

      {query.isLoading ? (
        <p className="trash-page__state" role="status">
          Загрузка корзины…
        </p>
      ) : query.error ? (
        <p className="trash-page__error" role="alert">
          Не удалось загрузить корзину. Попробуйте обновить страницу.
        </p>
      ) : result?.items.length ? (
        <>
          <ul ref={listRef} className="trash-list" tabIndex={-1} aria-label="Элементы в корзине">
            {result.items.map((item) => {
              const itemKey = `${item.entityType}:${item.entityId}`;
              const isBusy = busyKey === itemKey;

              return (
                <li key={itemKey} className="trash-list__item">
                  <div className="trash-list__content">
                    <span className="trash-list__type">{TYPE_LABELS[item.entityType]}</span>
                    <p className="trash-list__name">{item.entityName}</p>
                    <time dateTime={item.deletedAt}>Удалено {formatDeletedAt(item.deletedAt)}</time>
                  </div>
                  <div className="trash-list__actions">
                    <button
                      type="button"
                      className="trash-list__restore"
                      disabled={isBusy}
                      onClick={() => handleRestore(item)}
                    >
                      Восстановить
                    </button>
                    {canPurge ? (
                      <button
                        type="button"
                        className="trash-list__purge"
                        disabled={isBusy}
                        onClick={() => handlePurge(item)}
                      >
                        Удалить навсегда
                      </button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>

          {totalPages > 1 ? (
            <nav className="trash-page__pagination" aria-label="Страницы корзины">
              <button
                type="button"
                disabled={page <= 1 || query.isFetching}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Назад
              </button>
              <span>
                {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages || query.isFetching}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              >
                Вперёд
              </button>
            </nav>
          ) : null}
        </>
      ) : (
        <div className="trash-page__empty">
          <span aria-hidden="true">🗑</span>
          <h2>Корзина пуста</h2>
          <p>Удалённые задачи, сделки и приложения появятся здесь.</p>
        </div>
      )}
    </section>
  );
}
