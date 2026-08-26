'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import { useMeQuery } from '@/features/auth/hooks';
import { useWorkspacesQuery } from '@/features/workspaces/hooks';
import AppsPageView from '@/vue/apps/AppsPageView.vue';
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
  const { data: apps = [], isLoading, error, refetch } = useExternalAppsQuery(workspaceId);
  const createMutation = useCreateExternalAppMutation(workspaceId);
  const deleteMutation = useDeleteExternalAppMutation(workspaceId);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [iframeState, setIframeState] = useState<'loading' | 'ready' | 'blocked'>('loading');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [createError, setCreateError] = useState('');
  const [deleteError, setDeleteError] = useState('');

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

  const onCreate = useCallback(async () => {
    if (!title.trim() || !url.trim()) return;

    setCreateError('');
    try {
      const created = await createMutation.mutateAsync({
        title: title.trim(),
        url: url.trim(),
      });
      setTitle('');
      setUrl('');
      if (created) setSelectedAppId(created.id);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Не удалось добавить приложение');
    }
  }, [createMutation, title, url]);

  const onSelect = useCallback((appId: string) => {
    setSelectedAppId(appId);
  }, []);

  const onRequestDelete = useCallback((appId: string) => {
    setDeleteError('');
    setPendingDeleteId(appId);
  }, []);

  const onCancelDelete = useCallback(() => {
    setPendingDeleteId(null);
  }, []);

  const onConfirmDelete = useCallback(
    async (appId: string) => {
      setDeleteError('');
      try {
        await deleteMutation.mutateAsync(appId);
        setPendingDeleteId(null);
        if (selectedAppId === appId) {
          setSelectedAppId(null);
        }
      } catch (err) {
        setDeleteError(err instanceof Error ? err.message : 'Не удалось удалить приложение');
      }
    },
    [deleteMutation, selectedAppId],
  );

  const onIframeLoad = useCallback(() => setIframeState('ready'), []);
  const onIframeError = useCallback(() => setIframeState('blocked'), []);
  const onRetry = useCallback(() => {
    void refetch();
  }, [refetch]);

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

  const viewProps = useMemo(
    () => ({
      canAdd,
      title,
      url,
      createPending: createMutation.isPending,
      createError,
      pageError: error?.message ?? '',
      onRetry,
      items: listItems,
      selectedId: displayedAppId,
      pendingDeleteId,
      isDeleting: deleteMutation.isPending,
      deleteError,
      viewer: selectedApp
        ? {
            id: selectedApp.id,
            title: selectedApp.title,
            providerLabel: APP_PROVIDER_META[selectedApp.provider].label,
            sourceUrl: safeSourceUrl,
            embedUrl: safeEmbedUrl,
          }
        : null,
      iframeState,
      onTitleChange: setTitle,
      onUrlChange: setUrl,
      onCreate,
      onSelect,
      onRequestDelete,
      onConfirmDelete,
      onCancelDelete,
      onIframeLoad,
      onIframeError,
    }),
    [
      canAdd,
      title,
      url,
      createMutation.isPending,
      createError,
      error,
      onRetry,
      listItems,
      displayedAppId,
      pendingDeleteId,
      deleteMutation.isPending,
      deleteError,
      selectedApp,
      safeSourceUrl,
      safeEmbedUrl,
      iframeState,
      onCreate,
      onSelect,
      onRequestDelete,
      onConfirmDelete,
      onCancelDelete,
      onIframeLoad,
      onIframeError,
    ],
  );

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Загрузка приложений...</p>;
  }

  return <VueIsland component={AppsPageView} componentProps={viewProps} />;
}
