'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useMeQuery } from '@/features/auth/hooks';
import {
  useCreateDodTemplateMutation,
  useDeleteDodTemplateMutation,
  useDodTemplatesQuery,
  useUpdateDodTemplateMutation,
} from '../hooks';
import type { DodTemplate } from '../types';

export function DodTemplatesPage({ workspaceId }: { workspaceId: string }) {
  const { data: session } = useMeQuery();
  const templatesQuery = useDodTemplatesQuery(workspaceId);
  const createMutation = useCreateDodTemplateMutation(workspaceId);
  const updateMutation = useUpdateDodTemplateMutation(workspaceId);
  const deleteMutation = useDeleteDodTemplateMutation(workspaceId);

  const [name, setName] = useState('');
  const [itemsText, setItemsText] = useState('');
  const [gatesCompletion, setGatesCompletion] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const role = session?.workspaces.find((workspace) => workspace.id === workspaceId)?.role;
  const canManage = role === 'OWNER' || role === 'ADMIN' || role === 'MEMBER';
  const templates = templatesQuery.data ?? [];

  const parsedItems = useMemo(
    () =>
      itemsText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
    [itemsText],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return;
    try {
      await createMutation.mutateAsync({
        name: name.trim(),
        gatesCompletion,
        items: parsedItems,
      });
      setName('');
      setItemsText('');
      setGatesCompletion(true);
    } catch {
      /* ignore */
    }
  };

  const handleToggleGate = async (template: DodTemplate, next: boolean) => {
    setPendingId(template.id);
    try {
      await updateMutation.mutateAsync({
        templateId: template.id,
        data: { gatesCompletion: next },
      });
    } catch {
      /* ignore */
    } finally {
      setPendingId(null);
    }
  };

  const handleDelete = async (templateId: string) => {
    setPendingId(templateId);
    try {
      await deleteMutation.mutateAsync(templateId);
    } catch {
      /* ignore */
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="dod-page">
      <header className="dod-page__header">
        <h1>Definition of Done</h1>
        <p>
          Шаблоны чеклистов для задач. Обязательные пункты блокируют перенос в «Готово», пока не
          отмечены.
        </p>
      </header>

      {canManage ? (
        <section className="dod-page__form-block">
          <h2>Новый шаблон</h2>
          <form className="dod-page__form" onSubmit={(event) => void handleSubmit(event)}>
            <input
              className="glass-input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Название шаблона"
              maxLength={120}
              required
            />
            <textarea
              className="glass-input"
              value={itemsText}
              onChange={(event) => setItemsText(event.target.value)}
              placeholder={'Пункты — по одному в строке\nТесты\nCode review\nДокументация'}
              rows={5}
            />
            <label className="dod-page__toggle">
              <input
                type="checkbox"
                checked={gatesCompletion}
                onChange={(event) => setGatesCompletion(event.target.checked)}
              />
              Блокировать завершение, пока пункты не отмечены
            </label>
            <button
              type="submit"
              className="btn-primary"
              disabled={createMutation.isPending || !name.trim()}
            >
              Создать
            </button>
          </form>
          {createMutation.isError ? (
            <p className="dod-page__error">Не удалось создать шаблон.</p>
          ) : null}
        </section>
      ) : null}

      <section className="dod-page__list-block">
        <h2>Шаблоны</h2>
        {templatesQuery.isLoading ? <p>Загрузка...</p> : null}
        {templates.length === 0 && !templatesQuery.isLoading ? (
          <p className="dod-page__empty">Пока нет шаблонов DoD.</p>
        ) : null}
        <ul className="dod-page__list">
          {templates.map((template) => (
            <li key={template.id}>
              <div>
                <strong>{template.name}</strong>
                <p>
                  {template.items.length} пунктов
                  {template.gatesCompletion ? ' · блокирует Done' : ' · без блокировки'}
                </p>
                {template.items.length > 0 ? (
                  <ol>
                    {template.items.map((item) => (
                      <li key={item.id}>{item.text}</li>
                    ))}
                  </ol>
                ) : null}
              </div>
              {canManage ? (
                <div className="dod-page__actions">
                  <label>
                    <input
                      type="checkbox"
                      checked={template.gatesCompletion}
                      disabled={pendingId === template.id}
                      onChange={(event) => void handleToggleGate(template, event.target.checked)}
                    />
                    Gate
                  </label>
                  <button
                    type="button"
                    className="btn-ghost"
                    disabled={pendingId === template.id}
                    onClick={() => void handleDelete(template.id)}
                  >
                    Удалить
                  </button>
                </div>
              ) : null}
            </li>
          ))}
          {deleteMutation.isError ? (
            <p className="dod-page__error">Не удалось удалить шаблон.</p>
          ) : null}
          {updateMutation.isError ? (
            <p className="dod-page__error">Не удалось обновить шаблон.</p>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
