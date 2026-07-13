'use client';

import { useInvitationsQuery, useRevokeInvitationMutation } from '../hooks';

interface InvitationsListProps {
  workspaceId: string;
}

export function InvitationsList({ workspaceId }: InvitationsListProps) {
  const { data: invitations = [], isLoading } = useInvitationsQuery(workspaceId);
  const revokeMutation = useRevokeInvitationMutation(workspaceId);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Загрузка приглашений...</p>;
  }

  if (!invitations.length) {
    return <p className="text-sm text-muted-foreground">Активных приглашений нет.</p>;
  }

  return (
    <ul className="settings-invite-list">
      {invitations.map((invitation) => (
        <li key={invitation.id} className="settings-invite-item">
          <div>
            <p className="text-sm font-medium">{invitation.email}</p>
            <p className="text-xs text-muted-foreground">
              {invitation.role} · до {new Date(invitation.expiresAt).toLocaleDateString('ru-RU')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => revokeMutation.mutate(invitation.id)}
            disabled={revokeMutation.isPending}
            className="text-sm text-red-400 hover:text-red-300"
          >
            Отозвать
          </button>
        </li>
      ))}
    </ul>
  );
}
