'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useCreateFormMutation, useDeleteFormMutation, useFormsQuery } from '../hooks';

export function FormsListPage({ workspaceId }: { workspaceId: string }) {
  const { data: forms = [], isLoading } = useFormsQuery(workspaceId);
  const createMutation = useCreateFormMutation(workspaceId);
  const deleteMutation = useDeleteFormMutation(workspaceId);
  const [title, setTitle] = useState('');

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) return;
    const created = await createMutation.mutateAsync(title.trim());
    setTitle('');
    if (created?.id) {
      window.location.href = `/dashboard/forms/${created.id}`;
    }
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Загрузка форм...</p>;
  }

  return (
    <div className="forms-page">
      <header className="forms-page__header">
        <div>
          <h1 className="forms-page__title">Формы</h1>
          <p className="forms-page__subtitle">
            Создавайте опросы и собирайте ответы. Статистика по вариантам и автоматическое создание
            задач на доске.
          </p>
        </div>
      </header>

      <form onSubmit={handleCreate} className="forms-create">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Название новой формы"
          maxLength={120}
          className="glass-input"
        />
        <button
          type="submit"
          disabled={!title.trim() || createMutation.isPending}
          className="btn-primary"
        >
          Создать
        </button>
      </form>

      {forms.length === 0 ? (
        <p className="forms-page__empty">Пока нет форм. Создайте первую опросную форму выше.</p>
      ) : (
        <ul className="forms-list">
          {forms.map((form) => (
            <li key={form.id} className="forms-list__item">
              <div className="forms-list__main">
                <Link href={`/dashboard/forms/${form.id}`} className="forms-list__title">
                  {form.title}
                </Link>
                {form.description ? <p className="forms-list__desc">{form.description}</p> : null}
                <p className="forms-list__meta">
                  {form.fieldCount} полей · {form.responseCount} ответов
                </p>
              </div>
              <div className="forms-list__actions">
                <Link href={`/f/${form.publicToken}`} className="btn-ghost" target="_blank">
                  Открыть
                </Link>
                <button
                  type="button"
                  className="btn-ghost forms-list__danger"
                  disabled={deleteMutation.isPending}
                  onClick={() => {
                    if (window.confirm(`Удалить форму «${form.title}»?`)) {
                      void deleteMutation.mutateAsync(form.id);
                    }
                  }}
                >
                  Удалить
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
