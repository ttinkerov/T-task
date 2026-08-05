'use client';

import { useCallback, useMemo } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import InvitationsListView from '@/vue/workspaces/InvitationsList.vue';
import { useInvitationsQuery, useRevokeInvitationMutation } from '../hooks';

interface InvitationsListProps {
  workspaceId: string;
}

export function InvitationsList({ workspaceId }: InvitationsListProps) {
  const { data: invitations = [], isLoading } = useInvitationsQuery(workspaceId);
  const revokeMutation = useRevokeInvitationMutation(workspaceId);

  const onRevoke = useCallback(
    (invitationId: string) => {
      revokeMutation.mutate(invitationId);
    },
    [revokeMutation],
  );

  const listProps = useMemo(
    () => ({
      invitations,
      isLoading,
      isRevoking: revokeMutation.isPending,
      pendingId: revokeMutation.variables ?? null,
      onRevoke,
    }),
    [invitations, isLoading, revokeMutation.isPending, revokeMutation.variables, onRevoke],
  );

  return <VueIsland component={InvitationsListView} componentProps={listProps} />;
}
