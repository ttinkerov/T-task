'use client';

import { useCallback, useMemo, useState } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import TrashList from '@/vue/trash/TrashList.vue';
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

export function TrashPage({ workspaceId }: { workspaceId: string }) {
  const [page, setPage] = useState(1);
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

  const onRestore = useCallback(
    (payload: { entityType: TrashItem['entityType']; entityId: string }) => {
      restoreMutation.mutate(payload);
    },
    [restoreMutation],
  );

  const onPurge = useCallback(
    (payload: { entityType: TrashItem['entityType']; entityId: string }) => {
      purgeMutation.mutate(payload);
    },
    [purgeMutation],
  );

  const onPageChange = useCallback((nextPage: number) => {
    setPage(Math.max(1, nextPage));
  }, []);

  const listProps = useMemo(
    () => ({
      items: result?.items ?? [],
      page,
      totalPages,
      isLoading: query.isLoading,
      isFetching: query.isFetching,
      isError: Boolean(query.error),
      canPurge,
      busyKey,
      typeLabels: TYPE_LABELS,
      statusText: result ? `Страница ${page} из ${totalPages}` : '',
      onRestore,
      onPurge,
      onPageChange,
    }),
    [
      result,
      page,
      totalPages,
      query.isLoading,
      query.isFetching,
      query.error,
      canPurge,
      busyKey,
      onRestore,
      onPurge,
      onPageChange,
    ],
  );

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

      <VueIsland component={TrashList} componentProps={listProps} />
    </section>
  );
}
