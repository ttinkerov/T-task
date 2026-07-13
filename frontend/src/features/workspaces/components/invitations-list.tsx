'use client';

import { useInvitationsQuery, useRevokeInvitationMutation } from '../hooks';

interface InvitationsListProps {
  workspaceId: string;
}

export function InvitationsList({ workspaceId }: InvitationsListProps) {
  const { data: invitations = [], isLoading } = useInvitationsQuery(workspaceId);
  const revokeMutation = useRevokeInvitationMutation(workspaceId);

  if (isLoading) {
    return <p className="text-sm text-slate-500">Загрузка приглашений...</p>;
  }

  if (!invitations.length) {
    return <p className="text-sm text-slate-500">Активных приглашений нет.</p>;
  }

  return (
    <ul className="space-y-2">
      {invitations.map((invitation) => (
        <li
          key={invitation.id}
          className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700"
        >
          <div>
            <p className="text-sm font-medium">{invitation.email}</p>
            <p className="text-xs text-slate-500">
              {invitation.role} · до {new Date(invitation.expiresAt).toLocaleDateString('ru-RU')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => revokeMutation.mutate(invitation.id)}
            disabled={revokeMutation.isPending}
            className="text-sm text-red-600 hover:underline"
          >
            Отозвать
          </button>
        </li>
      ))}
    </ul>
  );
}
