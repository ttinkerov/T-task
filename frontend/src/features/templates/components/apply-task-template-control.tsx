'use client';

import { useCallback, useMemo } from 'react';
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
  const { data: templates = [] } = useTaskTemplatesQuery(workspaceId);
  const applyMutation = useApplyTaskTemplateMutation(workspaceId, taskId);

  const onApply = useCallback(
    (templateId: string) => applyMutation.mutateAsync(templateId),
    [applyMutation],
  );

  const viewProps = useMemo(
    () => ({
      templates,
      isPending: applyMutation.isPending,
      onApply,
    }),
    [templates, applyMutation.isPending, onApply],
  );

  if (templates.length === 0) return null;

  return <VueIsland component={ApplyTaskTemplateControlView} componentProps={viewProps} />;
}
