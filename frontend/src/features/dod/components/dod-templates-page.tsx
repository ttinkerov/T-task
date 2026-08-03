'use client';

import { FormEvent, useCallback, useMemo, useState } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import { useMeQuery } from '@/features/auth/hooks';
import DodTemplateList from '@/vue/dod/DodTemplateList.vue';
import {
  useCreateDodTemplateMutation,
  useDeleteDodTemplateMutation,
  useDodTemplatesQuery,
  useUpdateDodTemplateMutation,
} from '../hooks';

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

  const onToggleGate = useCallback(
    async (payload: { templateId: string; gatesCompletion: boolean }) => {
      setPendingId(payload.templateId);
      try {
        await updateMutation.mutateAsync({
          templateId: payload.templateId,
          data: { gatesCompletion: payload.gatesCompletion },
        });
      } catch {
        /* ignore */
      } finally {
        setPendingId(null);
      }
    },
    [updateMutation],
  );

  const onDelete = useCallback(
    async (templateId: string) => {
      setPendingId(templateId);
      try {
        await deleteMutation.mutateAsync(templateId);
      } catch {
        /* ignore */
      } finally {
        setPendingId(null);
      }
    },
    [deleteMutation],
  );

  const listProps = useMemo(
    () => ({
      templates,
      isLoading: templatesQuery.isLoading,
      canManage,
      pendingId,
      deleteError: deleteMutation.isError ? 'Не удалось удалить шаблон.' : '',
      updateError: updateMutation.isError ? 'Не удалось обновить шаблон.' : '',
      onToggleGate,
      onDelete,
    }),
    [
      templates,
      templatesQuery.isLoading,
      canManage,
      pendingId,
      deleteMutation.isError,
      updateMutation.isError,
      onToggleGate,
      onDelete,
    ],
  );

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

      <VueIsland component={DodTemplateList} componentProps={listProps} />
    </div>
  );
}
