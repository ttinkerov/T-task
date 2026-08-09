'use client';

import { useCallback, useMemo, useState } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import AddColumnPanelView from '@/vue/boards/AddColumnPanel.vue';
import { useCreateColumnMutation } from '../../hooks';

export function AddColumnPanel({ workspaceId, boardId }: { workspaceId: string; boardId: string }) {
  const createColumnMutation = useCreateColumnMutation(workspaceId, boardId);
  const [actionError, setActionError] = useState('');

  const onCreate = useCallback(
    async (name: string) => {
      setActionError('');
      try {
        await createColumnMutation.mutateAsync(name);
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Не удалось создать колонку');
        throw err;
      }
    },
    [createColumnMutation],
  );

  const viewProps = useMemo(
    () => ({
      pending: createColumnMutation.isPending,
      actionError,
      onCreate,
    }),
    [createColumnMutation.isPending, actionError, onCreate],
  );

  return <VueIsland component={AddColumnPanelView} componentProps={viewProps} />;
}
