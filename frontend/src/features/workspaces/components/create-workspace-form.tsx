'use client';

import { useCallback, useMemo } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import CreateWorkspaceFormView from '@/vue/workspaces/CreateWorkspaceForm.vue';
import { useCreateWorkspaceMutation } from '../hooks';

export function CreateWorkspaceForm() {
  const createMutation = useCreateWorkspaceMutation();

  const onCreate = useCallback(
    async (payload: { name: string }) => {
      await createMutation.mutateAsync(payload);
    },
    [createMutation],
  );

  const formProps = useMemo(
    () => ({
      isPending: createMutation.isPending,
      onCreate,
    }),
    [createMutation.isPending, onCreate],
  );

  return <VueIsland component={CreateWorkspaceFormView} componentProps={formProps} />;
}
