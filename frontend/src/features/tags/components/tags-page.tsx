'use client';

import { useMemo, useCallback } from 'react';
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
  const { data: tags = [], isLoading } = useTagsQuery(workspaceId);
  const createMutation = useCreateTagMutation(workspaceId);
  const updateMutation = useUpdateTagMutation(workspaceId);
  const deleteMutation = useDeleteTagMutation(workspaceId);

  const onCreate = useCallback(
    (payload: { name: string; color: string }) => {
      createMutation.mutate(payload);
    },
    [createMutation],
  );

  const onRename = useCallback(
    (payload: { tagId: string; name: string }) => {
      updateMutation.mutate({
        tagId: payload.tagId,
        data: { name: payload.name },
      });
    },
    [updateMutation],
  );

  const onDelete = useCallback(
    (tagId: string) => {
      deleteMutation.mutate(tagId);
    },
    [deleteMutation],
  );

  const listProps = useMemo(
    () => ({
      tags,
      isLoading,
      isCreating: createMutation.isPending,
      colorOptions: [...TAG_COLOR_OPTIONS],
      onRename,
      onDelete,
      onCreate,
    }),
    [tags, isLoading, createMutation.isPending, onRename, onDelete, onCreate],
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
