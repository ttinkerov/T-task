'use client';

import { useCallback, useMemo, useState } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import { useMeQuery } from '@/features/auth/hooks';
import { useTagsQuery } from '@/features/tags/hooks';
import DealTemplateCreateForm from '@/vue/templates/DealTemplateCreateForm.vue';
import DealTemplateList from '@/vue/templates/DealTemplateList.vue';
import TaskTemplateCreateForm from '@/vue/templates/TaskTemplateCreateForm.vue';
import TaskTemplateList from '@/vue/templates/TaskTemplateList.vue';
import {
  useCreateDealTemplateMutation,
  useCreateTaskTemplateMutation,
  useDealTemplatesQuery,
  useDeleteDealTemplateMutation,
  useDeleteTaskTemplateMutation,
  useSeedDealTemplatesMutation,
  useSeedTaskTemplatesMutation,
  useTaskTemplatesQuery,
} from '../hooks';
import type { CreateDealTemplatePayload, CreateTaskTemplatePayload, TaskPriority } from '../types';

const PRIORITY_OPTIONS: { value: TaskPriority | ''; label: string }[] = [
  { value: '', label: 'Без приоритета' },
  { value: 'LOW', label: 'Низкий' },
  { value: 'MEDIUM', label: 'Средний' },
  { value: 'HIGH', label: 'Высокий' },
  { value: 'URGENT', label: 'Срочный' },
];

export function TemplatesPage({ workspaceId }: { workspaceId: string }) {
  const { data: session } = useMeQuery();
  const role = session?.workspaces.find((workspace) => workspace.id === workspaceId)?.role;
  const canManage = role === 'OWNER' || role === 'ADMIN' || role === 'MEMBER';
  const [tab, setTab] = useState<'tasks' | 'deals'>('tasks');

  return (
    <div className="dod-page templates-page">
      <header className="dod-page__header">
        <h1>Шаблоны</h1>
        <p>
          Готовые заготовки задач и сделок: поля, чеклист, теги и сабтаски. Применяйте при создании
          карточки или из уже открытой задачи/сделки — пустые поля заполнятся, теги и чеклисты
          добавятся.
        </p>
      </header>

      <div className="templates-page__tabs" role="tablist" aria-label="Тип шаблонов">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'tasks'}
          className={tab === 'tasks' ? 'is-active' : undefined}
          onClick={() => setTab('tasks')}
        >
          Задачи
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'deals'}
          className={tab === 'deals' ? 'is-active' : undefined}
          onClick={() => setTab('deals')}
        >
          Сделки
        </button>
      </div>

      {tab === 'tasks' ? (
        <TaskTemplatesPanel workspaceId={workspaceId} canManage={canManage} />
      ) : (
        <DealTemplatesPanel workspaceId={workspaceId} canManage={canManage} />
      )}
    </div>
  );
}

function TaskTemplatesPanel({
  workspaceId,
  canManage,
}: {
  workspaceId: string;
  canManage: boolean;
}) {
  const templatesQuery = useTaskTemplatesQuery(workspaceId);
  const { data: tags = [] } = useTagsQuery(workspaceId);
  const createMutation = useCreateTaskTemplateMutation(workspaceId);
  const deleteMutation = useDeleteTaskTemplateMutation(workspaceId);
  const seedMutation = useSeedTaskTemplatesMutation(workspaceId);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const templates = templatesQuery.data ?? [];

  const onCreate = useCallback(
    async (payload: CreateTaskTemplatePayload) => {
      await createMutation.mutateAsync(payload);
    },
    [createMutation],
  );

  const onSeed = useCallback(async () => {
    await seedMutation.mutateAsync();
  }, [seedMutation]);

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
      tags,
      isLoading: templatesQuery.isLoading,
      canManage,
      pendingId,
      isDeleting: deleteMutation.isPending,
      deleteError: deleteMutation.error?.message ?? '',
      onDelete,
    }),
    [
      templates,
      tags,
      templatesQuery.isLoading,
      canManage,
      pendingId,
      deleteMutation.isPending,
      deleteMutation.error,
      onDelete,
    ],
  );

  const formProps = useMemo(
    () => ({
      tags,
      priorityOptions: PRIORITY_OPTIONS,
      showSeed: templates.length === 0,
      isCreating: createMutation.isPending,
      isSeeding: seedMutation.isPending,
      errorMessage: createMutation.error?.message ?? seedMutation.error?.message ?? '',
      onCreate,
      onSeed,
    }),
    [
      tags,
      templates.length,
      createMutation.isPending,
      createMutation.error,
      seedMutation.isPending,
      seedMutation.error,
      onCreate,
      onSeed,
    ],
  );

  return (
    <>
      {canManage ? (
        <VueIsland component={TaskTemplateCreateForm} componentProps={formProps} />
      ) : null}
      <VueIsland component={TaskTemplateList} componentProps={listProps} />
    </>
  );
}

function DealTemplatesPanel({
  workspaceId,
  canManage,
}: {
  workspaceId: string;
  canManage: boolean;
}) {
  const templatesQuery = useDealTemplatesQuery(workspaceId);
  const createMutation = useCreateDealTemplateMutation(workspaceId);
  const deleteMutation = useDeleteDealTemplateMutation(workspaceId);
  const seedMutation = useSeedDealTemplatesMutation(workspaceId);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const templates = templatesQuery.data ?? [];

  const onCreate = useCallback(
    async (payload: CreateDealTemplatePayload) => {
      await createMutation.mutateAsync(payload);
    },
    [createMutation],
  );

  const onSeed = useCallback(async () => {
    await seedMutation.mutateAsync();
  }, [seedMutation]);

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
      isDeleting: deleteMutation.isPending,
      deleteError: deleteMutation.error?.message ?? '',
      onDelete,
    }),
    [
      templates,
      templatesQuery.isLoading,
      canManage,
      pendingId,
      deleteMutation.isPending,
      deleteMutation.error,
      onDelete,
    ],
  );

  const formProps = useMemo(
    () => ({
      showSeed: templates.length === 0,
      isCreating: createMutation.isPending,
      isSeeding: seedMutation.isPending,
      errorMessage: createMutation.error?.message ?? seedMutation.error?.message ?? '',
      onCreate,
      onSeed,
    }),
    [
      templates.length,
      createMutation.isPending,
      createMutation.error,
      seedMutation.isPending,
      seedMutation.error,
      onCreate,
      onSeed,
    ],
  );

  return (
    <>
      {canManage ? (
        <VueIsland component={DealTemplateCreateForm} componentProps={formProps} />
      ) : null}
      <VueIsland component={DealTemplateList} componentProps={listProps} />
    </>
  );
}
