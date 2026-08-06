'use client';

import { useCallback, useMemo } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import AddColumnPanelView from '@/vue/boards/AddColumnPanel.vue';
import { useCreateColumnMutation } from '../../hooks';

export function AddColumnPanel({ workspaceId, boardId }: { workspaceId: string; boardId: string }) {
  const createColumnMutation = useCreateColumnMutation(workspaceId, boardId);

  const onCreate = useCallback(
    async (name: string) => {
      await createColumnMutation.mutateAsync(name);
    },
    [createColumnMutation],
  );

  const viewProps = useMemo(
    () => ({
      pending: createColumnMutation.isPending,
      onCreate,
    }),
    [createColumnMutation.isPending, onCreate],
  );

  return <VueIsland component={AddColumnPanelView} componentProps={viewProps} />;
}
