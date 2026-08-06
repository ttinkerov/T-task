'use client';

import { useCallback, useMemo } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import DealDrawerActionsView from '@/vue/crm/DealDrawerActions.vue';
import { useDeleteDealMutation } from '../hooks';

export function DealDrawerActions({
  workspaceId,
  funnelId,
  dealId,
  title,
  isSaving,
  saveError,
  onClose,
}: {
  workspaceId: string;
  funnelId: string;
  dealId: string;
  title: string;
  isSaving: boolean;
  saveError: string | null | undefined;
  onClose: () => void;
}) {
  const deleteMutation = useDeleteDealMutation(workspaceId, funnelId);

  const onDelete = useCallback(async () => {
    await deleteMutation.mutateAsync(dealId);
    onClose();
  }, [deleteMutation, dealId, onClose]);

  const viewProps = useMemo(
    () => ({
      isSaving,
      canSave: Boolean(title.trim()),
      saveError: saveError ?? '',
      deletePending: deleteMutation.isPending,
      onDelete,
    }),
    [isSaving, title, saveError, deleteMutation.isPending, onDelete],
  );

  return <VueIsland component={DealDrawerActionsView} componentProps={viewProps} />;
}
