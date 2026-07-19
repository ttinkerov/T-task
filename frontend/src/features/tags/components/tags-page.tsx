'use client';

import { useState } from 'react';
import {
  useCreateTagMutation,
  useDeleteTagMutation,
  useTagsQuery,
  useUpdateTagMutation,
} from '../hooks';
import { TAG_COLOR_OPTIONS } from '../types';

export function TagsPage({ workspaceId }: { workspaceId: string }) {
  const { data: tags = [], isLoading } = useTagsQuery(workspaceId);
  const createMutation = useCreateTagMutation(workspaceId);
  const updateMutation = useUpdateTagMutation(workspaceId);
  const deleteMutation = useDeleteTagMutation(workspaceId);
  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(TAG_COLOR_OPTIONS[4]);

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

      {isLoading ? <p role="status">Загрузка тегов...</p> : null}

      <ul className="tags-page__list" role="list">
        {tags.map((tag) => (
          <li key={tag.id}>
            <span className="tag-chip" style={{ background: `${tag.color}22`, color: tag.color }}>
              <i style={{ background: tag.color }} />
              {tag.name}
            </span>
            <div className="tags-page__actions">
              <button
                type="button"
                onClick={() => {
                  const next = window.prompt('Новое название', tag.name);
                  if (next && next.trim() && next.trim() !== tag.name) {
                    updateMutation.mutate({ tagId: tag.id, data: { name: next.trim() } });
                  }
                }}
              >
                Переименовать
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Удалить тег «${tag.name}»?`)) {
                    deleteMutation.mutate(tag.id);
                  }
                }}
              >
                Удалить
              </button>
            </div>
          </li>
        ))}
      </ul>

      {!isLoading && tags.length === 0 ? (
        <p className="tags-page__empty">Пока нет тегов — создайте первый выше.</p>
      ) : null}
    </section>
  );
}
