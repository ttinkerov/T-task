'use client';

import { useMemo, useCallback, useState } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import TagList from '@/vue/tags/TagList.vue';
import {
  useCreateTagMutation,
  useTagsQuery,
  useDeleteTagMutation,
  useUpdateTagMutation,
} from '../hooks';
import { TAG_COLOR_OPTIONS } from '../types';

export function TagsPage({ workspaceId }: { workspaceId: string }) {
  const { data: tags = [], isLoading, isError, error, refetch } = useTagsQuery(workspaceId);
  const createMutation = useCreateTagMutation(workspaceId);
  const updateMutation = useUpdateTagMutation(workspaceId);
  const deleteMutation = useDeleteTagMutation(workspaceId);
  const [actionError, setActionError] = useState('');

  const onCreate = useCallback(
    async (payload: { name: string; color: string }) => {
      setActionError('');
      try {
        await createMutation.mutateAsync(payload);
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Не удалось создать тег');
        throw err;
      }
    },
    [createMutation],
  );

  const onRename = useCallback(
    async (payload: { tagId: string; name: string }) => {
      setActionError('');
      try {
        await updateMutation.mutateAsync({
          tagId: payload.tagId,
          data: { name: payload.name },
        });
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Не удалось переименовать тег');
      }
    },
    [updateMutation],
  );

  const onDelete = useCallback(
    async (tagId: string) => {
      setActionError('');
      try {
        await deleteMutation.mutateAsync(tagId);
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Не удалось удалить тег');
      }
    },
    [deleteMutation],
  );

  const listProps = useMemo(
    () => ({
      tags,
      isLoading,
      isError,
      loadError: isError
        ? error instanceof Error
          ? error.message
          : 'Не удалось загрузить теги'
        : '',
      actionError,
      isCreating: createMutation.isPending,
      colorOptions: [...TAG_COLOR_OPTIONS],
      onRetryLoad: () => {
        void refetch();
      },
      onRename,
      onDelete,
      onCreate,
    }),
    [
      tags,
      isLoading,
      isError,
      error,
      actionError,
      createMutation.isPending,
      refetch,
      onRename,
      onDelete,
      onCreate,
    ],
  );

  return (
    <section className="tags-page" aria-labelledby="tags-title">
      <header className="tags-page__header">
        <div>
          <p className="tags-page__eyebrow">Рабочее пространство</p>
          <h1 id="tags-title">Теги</h1>
          <p>Цветные метки для фильтрации задач на доске и в списках.</p>
        </div>
      </header>

      <VueIsland component={TagList} componentProps={listProps} />
    </section>
  );
}
