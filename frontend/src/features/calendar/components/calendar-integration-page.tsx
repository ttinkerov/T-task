'use client';

import { useCallback, useMemo, useState } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import { getPublicOrigin } from '@/shared/lib/env';
import CalendarIntegrationPageView from '@/vue/calendar/CalendarIntegrationPage.vue';
import {
  useCalendarFeedStatusQuery,
  useCreateOrRotateCalendarFeedMutation,
  useRevokeCalendarFeedMutation,
} from '../hooks';

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

  const handleCreateOrRotate = useCallback(async () => {
    setNotice('');
    setCopyError('');
    try {
      const created = await createMutation.mutateAsync();
      if (!created) {
        return;
      }

      setFeedUrl(`${getPublicOrigin()}${created.feedPath}`);
      setNotice(
        status?.enabled
          ? 'Ссылка обновлена. Замените старую ссылку во всех календарях.'
          : 'Ссылка создана. Скопируйте её сейчас — позже она будет скрыта.',
      );
      setPendingAction(null);
    } catch (error) {
      setPendingAction(null);
      setCopyError(
        error instanceof Error
          ? error.message
          : 'Не удалось изменить интеграцию. Попробуйте ещё раз.',
      );
    }
  }, [createMutation, status?.enabled]);

  const handleCopy = useCallback(async () => {
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
  }, [feedUrl]);

  const handleRevoke = useCallback(async () => {
    setCopyError('');
    try {
      await revokeMutation.mutateAsync();
      setFeedUrl(null);
      setNotice('Доступ по ссылке отключён.');
      setPendingAction(null);
    } catch (error) {
      setPendingAction(null);
      setCopyError(
        error instanceof Error
          ? error.message
          : 'Не удалось отключить интеграцию. Попробуйте ещё раз.',
      );
    }
  }, [revokeMutation]);

  const onPrimaryAction = useCallback(() => {
    if (status?.enabled) {
      setPendingAction('rotate');
      return;
    }
    void handleCreateOrRotate();
  }, [handleCreateOrRotate, status?.enabled]);

  const onRequestRevoke = useCallback(() => {
    setPendingAction('revoke');
  }, []);

  const onConfirmPending = useCallback(() => {
    void (pendingAction === 'rotate' ? handleCreateOrRotate() : handleRevoke());
  }, [handleCreateOrRotate, handleRevoke, pendingAction]);

  const onCancelPending = useCallback(() => {
    setPendingAction(null);
  }, []);

  const viewProps = useMemo(
    () => ({
      enabled: Boolean(status?.enabled),
      tokenPrefix: status?.tokenPrefix ?? null,
      updatedAtLabel: formatDate(status?.updatedAt),
      isStatusLoading: statusQuery.isLoading,
      statusError: Boolean(statusQuery.error),
      feedUrl,
      webcalUrl,
      notice,
      copyError,
      actionError: Boolean(createMutation.error || revokeMutation.error),
      pendingAction,
      isBusy,
      createPending: createMutation.isPending,
      onCopy: handleCopy,
      onPrimaryAction,
      onRequestRevoke,
      onConfirmPending,
      onCancelPending,
      onRetryStatus: () => {
        void statusQuery.refetch();
      },
    }),
    [
      status?.enabled,
      status?.tokenPrefix,
      status?.updatedAt,
      statusQuery.isLoading,
      statusQuery.error,
      statusQuery.refetch,
      feedUrl,
      webcalUrl,
      notice,
      copyError,
      createMutation.error,
      createMutation.isPending,
      revokeMutation.error,
      pendingAction,
      isBusy,
      handleCopy,
      onPrimaryAction,
      onRequestRevoke,
      onConfirmPending,
      onCancelPending,
    ],
  );

  return <VueIsland component={CalendarIntegrationPageView} componentProps={viewProps} />;
}
