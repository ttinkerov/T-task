'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useMeQuery } from '@/features/auth/hooks';
import { useWorkspacesQuery } from '@/features/workspaces/hooks';
import {
  useCreateExternalAppMutation,
  useDeleteExternalAppMutation,
  useExternalAppsQuery,
} from '../hooks';
import { isSafeHttpsUrl } from '../lib/safe-external-url';
import { APP_PROVIDER_META } from '../types';

const EMBED_TIMEOUT_MS = 8_000;

export function AppsPage({ workspaceId }: { workspaceId: string }) {
  const { data: session } = useMeQuery();
  const { data: workspaces = [] } = useWorkspacesQuery();
  const { data: apps = [], isLoading, error } = useExternalAppsQuery(workspaceId);
  const createMutation = useCreateExternalAppMutation(workspaceId);
  const deleteMutation = useDeleteExternalAppMutation(workspaceId);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [iframeState, setIframeState] = useState<'loading' | 'ready' | 'blocked'>('loading');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');

  const workspaceRole = workspaces.find((workspace) => workspace.id === workspaceId)?.role;
  const canAdd = workspaceRole !== 'VIEWER';
  const canAdminister = workspaceRole === 'OWNER' || workspaceRole === 'ADMIN';
  const selectedApp = apps.find((app) => app.id === selectedAppId) ?? apps[0] ?? null;
  const displayedAppId = selectedApp?.id ?? null;
  const safeSourceUrl =
    selectedApp && isSafeHttpsUrl(selectedApp.sourceUrl) ? selectedApp.sourceUrl : null;
  const safeEmbedUrl =
    selectedApp && isSafeHttpsUrl(selectedApp.embedUrl) ? selectedApp.embedUrl : null;

  useEffect(() => {
    if (!displayedAppId) {
      setIframeState('loading');
      return;
    }

    if (!safeEmbedUrl) {
      setIframeState('blocked');
      return;
    }

    setIframeState('loading');
    const timer = window.setTimeout(() => {
      setIframeState((current) => (current === 'loading' ? 'blocked' : current));
    }, EMBED_TIMEOUT_MS);

    return () => window.clearTimeout(timer);
  }, [displayedAppId, safeEmbedUrl]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !url.trim()) return;

    try {
      const created = await createMutation.mutateAsync({
        title: title.trim(),
        url: url.trim(),
      });
      setTitle('');
      setUrl('');
      if (created) setSelectedAppId(created.id);
    } catch {
      /* ignore */
    }
  };

  const handleDelete = async (appId: string) => {
    try {
      await deleteMutation.mutateAsync(appId);
      setPendingDeleteId(null);
      if (selectedAppId === appId) {
        setSelectedAppId(null);
      }
    } catch {
      /* ignore */
    }
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Загрузка приложений...</p>;
  }

  return (
    <section className="apps-page">
      <header className="apps-page__header">
        <div>
          <span className="apps-page__eyebrow">Рабочее пространство</span>
          <h1>Приложения</h1>
          <p>Google Документы и Таблицы, Figma, Miro и Airtable — рядом с задачами команды.</p>
        </div>
        <div className="apps-page__providers" aria-label="Поддерживаемые сервисы">
          {Object.values(APP_PROVIDER_META).map((provider) => (
            <span key={provider.label} title={provider.label}>
              {provider.icon}
            </span>
          ))}
        </div>
      </header>

      {canAdd ? (
        <form className="apps-create" onSubmit={handleCreate} aria-label="Добавить приложение">
          <label>
            <span>Название</span>
            <input
              className="glass-input"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={120}
              placeholder="Например, Макеты приложения"
              required
            />
          </label>
          <label className="apps-create__url">
            <span>Ссылка на ресурс</span>
            <input
              className="glass-input"
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              maxLength={2048}
              placeholder="https://www.figma.com/design/..."
              required
            />
          </label>
          <button
            type="submit"
            className="btn-primary"
            disabled={createMutation.isPending || !title.trim() || !url.trim()}
          >
            {createMutation.isPending ? 'Добавление…' : 'Добавить'}
          </button>
          <p className="apps-create__hint">
            Airtable принимает только публичную embed-ссылку. Доступ к содержимому регулируется
            настройками самого сервиса.
          </p>
          {createMutation.error ? (
            <p className="apps-create__error" role="alert">
              {createMutation.error.message}
            </p>
          ) : null}
        </form>
      ) : null}

      {error ? (
        <p className="apps-page__error" role="alert">
          {error.message}
        </p>
      ) : null}

      {apps.length === 0 ? (
        <div className="apps-empty">
          <span>↗</span>
          <h2>Подключите первый рабочий ресурс</h2>
          <p>Вставьте ссылку выше — сервис определится автоматически.</p>
        </div>
      ) : (
        <div className="apps-workspace">
          <aside className="apps-list" aria-label="Подключённые приложения">
            <ul>
              {apps.map((app) => {
                const provider = APP_PROVIDER_META[app.provider];
                const canDelete = canAdminister || app.createdBy?.id === session?.user.id;
                const isActive = displayedAppId === app.id;

                return (
                  <li
                    key={app.id}
                    className={`apps-list__item ${isActive ? 'apps-list__item--active' : ''}`}
                  >
                    <button
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => setSelectedAppId(app.id)}
                    >
                      <span
                        className={`apps-list__provider apps-list__provider--${provider.tone}`}
                        aria-hidden="true"
                      >
                        {provider.icon}
                      </span>
                      <span className="apps-list__copy">
                        <strong>{app.title}</strong>
                        <small>
                          {provider.label}
                          {app.createdBy ? ` · ${app.createdBy.name}` : ''}
                        </small>
                      </span>
                    </button>
                    {canDelete ? (
                      pendingDeleteId === app.id ? (
                        <div className="apps-list__confirm">
                          <button
                            type="button"
                            className="apps-list__confirm-yes"
                            onClick={() => void handleDelete(app.id)}
                            disabled={deleteMutation.isPending}
                          >
                            Удалить
                          </button>
                          <button
                            type="button"
                            className="apps-list__confirm-no"
                            onClick={() => setPendingDeleteId(null)}
                          >
                            Отмена
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="apps-list__delete"
                          onClick={() => setPendingDeleteId(app.id)}
                          disabled={deleteMutation.isPending}
                          aria-label={`Удалить «${app.title}»`}
                        >
                          ×
                        </button>
                      )
                    ) : null}
                  </li>
                );
              })}
            </ul>
            {deleteMutation.error ? (
              <p className="apps-list__error" role="alert">
                {deleteMutation.error.message}
              </p>
            ) : null}
          </aside>

          {selectedApp ? (
            <div className="apps-viewer">
              <div className="apps-viewer__toolbar">
                <div>
                  <strong>{selectedApp.title}</strong>
                  <span>{APP_PROVIDER_META[selectedApp.provider].label}</span>
                </div>
                {safeSourceUrl ? (
                  <a href={safeSourceUrl} target="_blank" rel="noreferrer">
                    Открыть в сервисе ↗
                  </a>
                ) : null}
              </div>

              <div className="apps-viewer__frame">
                {iframeState === 'blocked' || !safeEmbedUrl ? (
                  <div className="apps-viewer__fallback">
                    <h2>Не удалось встроить ресурс</h2>
                    <p>
                      Сервис мог запретить встраивание или ссылка недоступна. Откройте его во
                      внешней вкладке.
                    </p>
                    {safeSourceUrl ? (
                      <a
                        className="btn-primary"
                        href={safeSourceUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Открыть в сервисе
                      </a>
                    ) : null}
                  </div>
                ) : (
                  <>
                    {iframeState === 'loading' ? (
                      <p className="apps-viewer__status">Загрузка встроенного просмотра…</p>
                    ) : null}
                    {}
                    <iframe
                      key={selectedApp.id}
                      src={safeEmbedUrl}
                      title={`${selectedApp.title} — ${APP_PROVIDER_META[selectedApp.provider].label}`}
                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                      referrerPolicy="no-referrer"
                      allow="clipboard-read; clipboard-write; fullscreen"
                      onLoad={() => setIframeState('ready')}
                      onError={() => setIframeState('blocked')}
                    />
                  </>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
