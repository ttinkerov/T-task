'use client';

import { useCallback, useMemo, useState } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import InvitationsListView from '@/vue/workspaces/InvitationsList.vue';
import { useInvitationsQuery, useRevokeInvitationMutation } from '../hooks';
import type { WorkspaceRole } from '../types';

interface InvitationsListProps {
  workspaceId: string;
}

const ROLE_LABELS: Record<WorkspaceRole, string> = {
  VIEWER: 'Наблюдатель',
  MEMBER: 'Участник',
  ADMIN: 'Админ',
  OWNER: 'Владелец',
};

export function InvitationsList({ workspaceId }: InvitationsListProps) {
  const {
    data: invitations = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useInvitationsQuery(workspaceId);
  const revokeMutation = useRevokeInvitationMutation(workspaceId);
  const [actionError, setActionError] = useState('');

  const onRevoke = useCallback(
    async (invitationId: string) => {
      setActionError('');
      try {
        await revokeMutation.mutateAsync(invitationId);
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Не удалось отозвать приглашение');
      }
    },
    [revokeMutation],
  );

  const listProps = useMemo(
    () => ({
      invitations,
      isLoading,
      isError,
      loadError: isError
        ? error instanceof Error
          ? error.message
          : 'Не удалось загрузить приглашения'
        : '',
      actionError,
      isRevoking: revokeMutation.isPending,
      pendingId: revokeMutation.variables ?? null,
      roleLabels: ROLE_LABELS,
      onRetryLoad: () => {
        void refetch();
      },
      onRevoke,
    }),
    [
      invitations,
      isLoading,
      isError,
      error,
      actionError,
      revokeMutation.isPending,
      revokeMutation.variables,
      refetch,
      onRevoke,
    ],
  );

  return <VueIsland component={InvitationsListView} componentProps={listProps} />;
}
