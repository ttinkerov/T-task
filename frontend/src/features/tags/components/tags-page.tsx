'use client';

import { useMemo, useState } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import TagList from '@/vue/tags/TagList.vue';
import { useCreateTagMutation, useTagsQuery } from '../hooks';
import { TAG_COLOR_OPTIONS } from '../types';

export function TagsPage({ workspaceId }: { workspaceId: string }) {
  const { data: tags = [], isLoading } = useTagsQuery(workspaceId);
  const createMutation = useCreateTagMutation(workspaceId);
  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(TAG_COLOR_OPTIONS[4]);

  const listProps = useMemo(() => ({ tags, isLoading }), [tags, isLoading]);

  return (
    <section className="tags-page" aria-labelledby="tags-title">
      <header className="tags-page__header">
        <div>
          <p className="tags-page__eyebrow">Рабочее пространство</p>
          <h1 id="tags-title">Теги</h1>
          <p>Цветные метки для фильтрации задач на доске и в списках.</p>
        </div>
      </header>

      <form
        className="tags-page__create"
        onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim()) return;
          createMutation.mutate(
            { name: name.trim(), color },
            {
              onSuccess: () => setName(''),
            },
          );
        }}
      >
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Название тега"
          maxLength={40}
          aria-label="Название тега"
        />
        <div className="tags-page__colors" role="group" aria-label="Цвет тега">
          {TAG_COLOR_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              className={color === option ? 'is-active' : undefined}
              style={{ background: option }}
              aria-label={`Цвет ${option}`}
              aria-pressed={color === option}
              onClick={() => setColor(option)}
            />
          ))}
        </div>
        <button type="submit" disabled={createMutation.isPending || !name.trim()}>
          Добавить
        </button>
      </form>

      <VueIsland component={TagList} componentProps={listProps} />
    </section>
  );
}
