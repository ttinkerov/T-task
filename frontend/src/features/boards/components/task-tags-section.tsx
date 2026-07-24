'use client';

import type { TaskTag } from '@/features/boards/types';
import { useSetTaskTagsMutation, useTagsQuery } from '@/features/tags/hooks';
import { FieldHint } from './field-hint';

export function TaskTagsSection({
  workspaceId,
  taskId,
  selected,
}: {
  workspaceId: string;
  taskId: string;
  selected: TaskTag[];
}) {
  const { data: tags = [] } = useTagsQuery(workspaceId);
  const setTagsMutation = useSetTaskTagsMutation(workspaceId, taskId);
  const selectedIds = new Set(selected.map((tag) => tag.id));

  const toggle = (tagId: string) => {
    const next = selectedIds.has(tagId)
      ? selected.filter((tag) => tag.id !== tagId).map((tag) => tag.id)
      : [...selected.map((tag) => tag.id), tagId];
    setTagsMutation.mutate(next);
  };

  return (
    <section className="task-tags" aria-labelledby="task-tags-title">
      <h3 id="task-tags-title" className="task-drawer__section-title">
        Теги
        <FieldHint text="Метки для группировки и фильтрации задач на доске." />
      </h3>
      {tags.length === 0 ? (
        <p className="task-tags__empty">Тегов пока нет. Создайте их в разделе «Теги».</p>
      ) : (
        <div className="task-tags__list">
          {tags.map((tag) => {
            const active = selectedIds.has(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                className={`tag-chip${active ? ' tag-chip--active' : ''}`}
                style={{
                  background: active ? `${tag.color}33` : 'transparent',
                  color: tag.color,
                  borderColor: tag.color,
                }}
                aria-pressed={active}
                disabled={setTagsMutation.isPending}
                onClick={() => toggle(tag.id)}
              >
                <i style={{ background: tag.color }} />
                {tag.name}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
