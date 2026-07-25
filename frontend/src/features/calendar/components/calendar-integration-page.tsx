'use client';

import { useState } from 'react';
import { getApiBaseUrl } from '@/shared/lib/env';
import {
  useCalendarFeedStatusQuery,
  useCreateOrRotateCalendarFeedMutation,
  useRevokeCalendarFeedMutation,
} from '../hooks';
import { CALENDAR_PROVIDER_ICONS } from './calendar-provider-icons';

const PROVIDERS = [
  {
    key: 'google',
    name: 'Google Calendar',
    instruction: 'Настройки → Добавить календарь → Добавить по URL',
  },
  {
    key: 'yandex',
    name: 'Яндекс Календарь',
    instruction: 'Новый календарь → По ссылке → вставьте URL',
  },
  {
    key: 'apple',
    name: 'Apple Calendar',
    instruction: 'Файл → Новая подписка на календарь',
  },
  {
    key: 'caldav',
    name: 'Другой календарь',
    instruction: 'Добавьте подписной календарь по URL или через webcal',
  },
] as const;

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return '';
  }

  return new Date(value).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function CalendarIntegrationPage({ workspaceId }: { workspaceId: string }) {
  const statusQuery = useCalendarFeedStatusQuery(workspaceId);
  const createMutation = useCreateOrRotateCalendarFeedMutation(workspaceId);
  const revokeMutation = useRevokeCalendarFeedMutation(workspaceId);
  const [feedUrl, setFeedUrl] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [copyError, setCopyError] = useState('');
  const [pendingAction, setPendingAction] = useState<'rotate' | 'revoke' | null>(null);
  const status = statusQuery.data;
  const isBusy = createMutation.isPending || revokeMutation.isPending;
  const webcalUrl = feedUrl?.replace(/^https?:/, 'webcal:') ?? null;

  const handleCreateOrRotate = async () => {
    setNotice('');
    setCopyError('');
    try {
      const created = await createMutation.mutateAsync();
      if (!created) {
        return;
      }

      setFeedUrl(`${getApiBaseUrl()}${created.feedPath}`);
      setNotice(
        status?.enabled
          ? 'Ссылка обновлена. Замените старую ссылку во всех календарях.'
          : 'Ссылка создана. Скопируйте её сейчас — позже она будет скрыта.',
      );
      setPendingAction(null);
    } catch {
      setFeedUrl(null);
    }
  };

  const handleCopy = async () => {
    if (!feedUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(feedUrl);
      setCopyError('');
      setNotice('Ссылка скопирована.');
    } catch {
      setCopyError('Не удалось скопировать автоматически. Выделите ссылку и скопируйте вручную.');
    }
  };

  const handleRevoke = async () => {
    try {
      await revokeMutation.mutateAsync();
      setFeedUrl(null);
      setCopyError('');
      setNotice('Доступ по ссылке отключён.');
      setPendingAction(null);
    } catch {
      setPendingAction(null);
    }
  };

  return (
    <section className="calendar-page" aria-labelledby="calendar-page-title">
      <header className="calendar-page__header">
        <div>
          <span className="calendar-page__eyebrow">Личный календарь</span>
          <h1 id="calendar-page-title">Интеграция с календарями</h1>
          <p>
            Подпишите Google, Яндекс, Apple или другой календарь на дедлайны задач, назначенных вам
            в этой команде.
          </p>
        </div>
        <span className="calendar-page__sync-badge">
          <span aria-hidden="true">↻</span>
          Односторонняя синхронизация
        </span>
      </header>

      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {notice}
      </p>

      <div className="calendar-page__grid">
        <article className="calendar-feed" aria-labelledby="calendar-feed-title">
          <div className="calendar-feed__heading">
            <div>
              <span className="calendar-feed__icon" aria-hidden="true">
                31
              </span>
              <div>
                <h2 id="calendar-feed-title">Календарь задач</h2>
                <p>Дедлайны отображаются как события на весь день.</p>
              </div>
            </div>
            {statusQuery.isLoading ? (
              <span className="calendar-feed__status" role="status" aria-live="polite">
                Проверяем…
              </span>
            ) : status?.enabled ? (
              <span
                className="calendar-feed__status calendar-feed__status--active"
                role="status"
                aria-live="polite"
              >
                <span aria-hidden="true" /> Подключён
              </span>
            ) : (
              <span className="calendar-feed__status" role="status" aria-live="polite">
                Не подключён
              </span>
            )}
          </div>

          {statusQuery.error ? (
            <p className="calendar-feed__error" role="alert">
              Не удалось проверить интеграцию. Обновите страницу и попробуйте снова.
            </p>
          ) : null}

          {feedUrl ? (
            <div className="calendar-feed__url">
              <label htmlFor="calendar-feed-url">Приватная ссылка</label>
              <div>
                <input
                  id="calendar-feed-url"
                  value={feedUrl}
                  readOnly
                  spellCheck={false}
                  aria-describedby="calendar-feed-url-hint"
                />
                <button type="button" onClick={handleCopy}>
                  Копировать
                </button>
              </div>
              <p id="calendar-feed-url-hint">
                Сохраните ссылку сейчас: в целях безопасности мы не показываем её повторно.
              </p>
            </div>
          ) : status?.enabled ? (
            <div className="calendar-feed__hidden-url">
              <span aria-hidden="true">••••••••</span>
              <p>
                Ссылка скрыта. Её начало: <strong>{status.tokenPrefix}…</strong>
              </p>
            </div>
          ) : null}

          {copyError ? (
            <p className="calendar-feed__error" role="alert">
              {copyError}
            </p>
          ) : null}
          {createMutation.error || revokeMutation.error ? (
            <p className="calendar-feed__error" role="alert">
              Не удалось изменить интеграцию. Попробуйте ещё раз.
            </p>
          ) : null}

          {pendingAction ? (
            <div className="calendar-feed__confirmation" role="group" aria-label="Подтверждение">
              <p>
                {pendingAction === 'rotate'
                  ? 'Текущая ссылка перестанет работать. Замените её во всех календарях.'
                  : 'Подключённые календари больше не смогут обновлять задачи.'}
              </p>
              <div>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() =>
                    void (pendingAction === 'rotate' ? handleCreateOrRotate() : handleRevoke())
                  }
                  disabled={isBusy}
                >
                  {pendingAction === 'rotate' ? 'Обновить ссылку' : 'Отключить календарь'}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setPendingAction(null)}
                  disabled={isBusy}
                >
                  Отмена
                </button>
              </div>
            </div>
          ) : null}

          <div className="calendar-feed__actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() =>
                status?.enabled ? setPendingAction('rotate') : void handleCreateOrRotate()
              }
              disabled={isBusy || statusQuery.isLoading || pendingAction !== null}
            >
              {createMutation.isPending
                ? 'Создаём…'
                : status?.enabled
                  ? 'Обновить приватную ссылку'
                  : 'Создать приватную ссылку'}
            </button>
            {webcalUrl ? (
              <a className="btn btn-ghost" href={webcalUrl} rel="noopener noreferrer">
                Открыть в приложении
              </a>
            ) : null}
            {status?.enabled ? (
              <button
                type="button"
                className="calendar-feed__revoke"
                onClick={() => setPendingAction('revoke')}
                disabled={isBusy || pendingAction !== null}
              >
                Отключить
              </button>
            ) : null}
          </div>

          {status?.enabled && status.updatedAt ? (
            <p className="calendar-feed__updated">
              Ссылка обновлена {formatDate(status.updatedAt)}
            </p>
          ) : null}

          <aside className="calendar-feed__warning" aria-label="Предупреждение о безопасности">
            <span aria-hidden="true">!</span>
            <p>
              Ссылка открывает названия, описания и дедлайны ваших задач без входа в T-task. Не
              публикуйте её. При утечке сразу обновите или отключите ссылку.
            </p>
          </aside>
        </article>

        <aside className="calendar-providers" aria-labelledby="calendar-providers-title">
          <div className="calendar-providers__heading">
            <span>Подключение</span>
            <h2 id="calendar-providers-title">Добавьте ссылку в свой календарь</h2>
            <p>Обновления подтягиваются календарным сервисом автоматически.</p>
          </div>
          <ol role="list">
            {PROVIDERS.map((provider) => (
              <li key={provider.key}>
                <span
                  className={`calendar-provider calendar-provider--${provider.key}`}
                  aria-hidden="true"
                >
                  {CALENDAR_PROVIDER_ICONS[provider.key]}
                </span>
                <div>
                  <strong>{provider.name}</strong>
                  <p>{provider.instruction}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="calendar-providers__note">
            Изменения из внешнего календаря не меняют задачи в T-task. Google и другие сервисы сами
            определяют интервал обновления подписки.
          </p>
        </aside>
      </div>
    </section>
  );
}
