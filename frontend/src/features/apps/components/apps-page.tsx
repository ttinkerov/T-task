'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import { useMeQuery } from '@/features/auth/hooks';
import { useWorkspacesQuery } from '@/features/workspaces/hooks';
import AppsList from '@/vue/apps/AppsList.vue';
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

  const onSelect = useCallback((appId: string) => {
    setSelectedAppId(appId);
  }, []);

  const onRequestDelete = useCallback((appId: string) => {
    setPendingDeleteId(appId);
  }, []);

  const onCancelDelete = useCallback(() => {
    setPendingDeleteId(null);
  }, []);

  const onConfirmDelete = useCallback(
    async (appId: string) => {
      try {
        await deleteMutation.mutateAsync(appId);
        setPendingDeleteId(null);
        if (selectedAppId === appId) {
          setSelectedAppId(null);
        }
      } catch {
        /* ignore */
      }
    },
    [deleteMutation, selectedAppId],
  );

  const listItems = useMemo(
    () =>
      apps.map((app) => {
        const provider = APP_PROVIDER_META[app.provider];
        return {
          id: app.id,
          title: app.title,
          providerIcon: provider.icon,
          providerLabel: provider.label,
          providerTone: provider.tone,
          createdByName: app.createdBy?.name ?? '',
          canDelete: canAdminister || app.createdBy?.id === session?.user.id,
        };
      }),
    [apps, canAdminister, session?.user.id],
  );

  const listProps = useMemo(
    () => ({
      items: listItems,
      selectedId: displayedAppId,
      pendingDeleteId,
      isDeleting: deleteMutation.isPending,
      deleteError: deleteMutation.error?.message ?? '',
      onSelect,
      onRequestDelete,
      onConfirmDelete,
      onCancelDelete,
    }),
    [
      listItems,
      displayedAppId,
      pendingDeleteId,
      deleteMutation.isPending,
      deleteMutation.error,
      onSelect,
      onRequestDelete,
      onConfirmDelete,
      onCancelDelete,
    ],
  );

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
        <VueIsland component={AppsList} componentProps={listProps} />
      ) : (
        <div className="apps-workspace">
          <VueIsland component={AppsList} componentProps={listProps} />

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
