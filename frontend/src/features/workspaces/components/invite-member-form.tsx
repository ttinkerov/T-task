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
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800"
    >
      <h3 className="text-sm font-medium">Пригласить участника</h3>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <input
          type="email"
          required
          placeholder="email@company.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
        <select
          value={role}
          onChange={(event) => setRole(event.target.value as WorkspaceRole)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="VIEWER">Viewer</option>
          <option value="MEMBER">Member</option>
          <option value="ADMIN">Admin</option>
        </select>
        <button
          type="submit"
          disabled={inviteMutation.isPending}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white dark:bg-slate-100 dark:text-slate-900"
        >
          Пригласить
        </button>
      </div>

      {inviteMutation.error ? (
        <p className="text-sm text-red-600">{inviteMutation.error.message}</p>
      ) : null}

      {inviteLink ? (
        <p className="break-all text-sm text-slate-600 dark:text-slate-300">
          Ссылка приглашения: {inviteLink}
        </p>
      ) : null}
    </form>
  );
}
