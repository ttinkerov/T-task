'use client';

import { useCallback, useMemo, useState } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import ApplyTaskTemplateControlView from '@/vue/templates/ApplyTaskTemplateControl.vue';
import { useApplyTaskTemplateMutation, useTaskTemplatesQuery } from '../hooks';

export function ApplyTaskTemplateControl({
  workspaceId,
  taskId,
}: {
  workspaceId: string;
  taskId: string;
}) {
  const { data: templates = [], isError, error, refetch } = useTaskTemplatesQuery(workspaceId);
  const applyMutation = useApplyTaskTemplateMutation(workspaceId, taskId);
  const [actionError, setActionError] = useState('');

  const onApply = useCallback(
    async (templateId: string) => {
      setActionError('');
      try {
        await applyMutation.mutateAsync(templateId);
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Не удалось применить шаблон');
        throw err;
      }
    },
    [applyMutation],
  );

  const loadError = isError
    ? error instanceof Error
      ? error.message
      : 'Не удалось загрузить шаблоны'
    : '';

  const viewProps = useMemo(
    () => ({
      templates,
      isPending: applyMutation.isPending,
      actionError: actionError || loadError,
      onApply,
      onRetry: isError
        ? () => {
            void refetch();
          }
        : undefined,
    }),
    [templates, applyMutation.isPending, actionError, loadError, onApply, isError, refetch],
  );

  if (!isError && templates.length === 0) return null;

  return <VueIsland component={ApplyTaskTemplateControlView} componentProps={viewProps} />;
}
