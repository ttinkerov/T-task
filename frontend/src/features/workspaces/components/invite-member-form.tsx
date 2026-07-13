'use client';

import { FormEvent, useState } from 'react';
import { useCreateInvitationMutation } from '../hooks';
import type { WorkspaceRole } from '../types';

interface InviteMemberFormProps {
  workspaceId: string;
}

export function InviteMemberForm({ workspaceId }: InviteMemberFormProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<WorkspaceRole>('MEMBER');
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const inviteMutation = useCreateInvitationMutation(workspaceId);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setInviteLink(null);

    const result = await inviteMutation.mutateAsync({ email, role });

    if (result?.token) {
      const link = `${window.location.origin}/invite/${result.token}`;
      setInviteLink(link);
      setEmail('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="settings-invite-grid">
        <input
          type="email"
          required
          placeholder="email@company.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="glass-input"
        />
        <select
          value={role}
          onChange={(event) => setRole(event.target.value as WorkspaceRole)}
          className="glass-input"
        >
          <option value="VIEWER">Viewer</option>
          <option value="MEMBER">Member</option>
          <option value="ADMIN">Admin</option>
        </select>
        <button type="submit" disabled={inviteMutation.isPending} className="btn-primary">
          {inviteMutation.isPending ? 'Отправка...' : 'Пригласить'}
        </button>
      </div>

      {inviteMutation.error ? (
        <p className="text-sm text-red-400">{inviteMutation.error.message}</p>
      ) : null}

      {inviteLink ? (
        <p className="break-all text-sm text-muted-foreground">Ссылка приглашения: {inviteLink}</p>
      ) : null}
    </form>
  );
}
