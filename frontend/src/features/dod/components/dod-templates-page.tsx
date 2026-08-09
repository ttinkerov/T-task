'use client';

import { useCallback, useMemo, useState } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import { useMeQuery } from '@/features/auth/hooks';
import DodTemplateCreateForm from '@/vue/dod/DodTemplateCreateForm.vue';
import DodTemplateList from '@/vue/dod/DodTemplateList.vue';
import {
  useCreateDodTemplateMutation,
  useDeleteDodTemplateMutation,
  useDodTemplatesQuery,
  useUpdateDodTemplateMutation,
} from '../hooks';
import type { CreateDodTemplatePayload } from '../types';

export function DodTemplatesPage({ workspaceId }: { workspaceId: string }) {
  const { data: session } = useMeQuery();
  const templatesQuery = useDodTemplatesQuery(workspaceId);
  const createMutation = useCreateDodTemplateMutation(workspaceId);
  const updateMutation = useUpdateDodTemplateMutation(workspaceId);
  const deleteMutation = useDeleteDodTemplateMutation(workspaceId);

  const [pendingId, setPendingId] = useState<string | null>(null);

  const role = session?.workspaces.find((workspace) => workspace.id === workspaceId)?.role;
  const canManage = role === 'OWNER' || role === 'ADMIN' || role === 'MEMBER';
  const templates = templatesQuery.data ?? [];

  const onCreate = useCallback(
    async (payload: CreateDodTemplatePayload) => {
      await createMutation.mutateAsync(payload);
    },
    [createMutation],
  );

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

  const formProps = useMemo(
    () => ({
      isCreating: createMutation.isPending,
      errorMessage: createMutation.isError ? 'Не удалось создать шаблон.' : '',
      onCreate,
    }),
    [createMutation.isPending, createMutation.isError, onCreate],
  );

  return (
    <div className="dod-page">
      <header className="dod-page__header">
        <h1>Критерии готовности</h1>
        <p>
          Шаблоны чеклистов для задач. Обязательные пункты блокируют перенос в «Готово», пока не
          отмечены.
        </p>
      </header>

      {canManage ? (
        <VueIsland component={DodTemplateCreateForm} componentProps={formProps} />
      ) : null}

      <VueIsland component={DodTemplateList} componentProps={listProps} />
    </div>
  );
}
