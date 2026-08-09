'use client';

import { useCallback, useMemo, useState } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import InviteMemberFormView from '@/vue/workspaces/InviteMemberForm.vue';
import { useCreateInvitationMutation } from '../hooks';
import type { WorkspaceRole } from '../types';

interface InviteMemberFormProps {
  workspaceId: string;
}

const ROLE_OPTIONS: Array<{ value: WorkspaceRole; label: string }> = [
  { value: 'VIEWER', label: 'Наблюдатель' },
  { value: 'MEMBER', label: 'Участник' },
  { value: 'ADMIN', label: 'Админ' },
];

export function InviteMemberForm({ workspaceId }: InviteMemberFormProps) {
  const [inviteLink, setInviteLink] = useState('');
  const [emailHint, setEmailHint] = useState('');
  const inviteMutation = useCreateInvitationMutation(workspaceId);

  const onInvite = useCallback(
    async (payload: { email: string; role: string; sendEmail: boolean }) => {
      setInviteLink('');
      setEmailHint('');
      const result = await inviteMutation.mutateAsync({
        email: payload.email,
        role: payload.role as WorkspaceRole,
        sendEmail: payload.sendEmail,
      });
      if (result?.token) {
        setInviteLink(`${window.location.origin}/invite/${result.token}`);
      }
      if (payload.sendEmail && result && !result.emailSent) {
        setEmailHint('Письмо не отправлено: SMTP не настроен. Используйте ссылку.');
      } else if (payload.sendEmail && result?.emailSent) {
        setEmailHint('Письмо отправлено.');
      } else {
        setEmailHint('Письмо не отправлялось — поделитесь ссылкой.');
      }
    },
    [inviteMutation],
  );

  const formProps = useMemo(
    () => ({
      roleOptions: ROLE_OPTIONS,
      isPending: inviteMutation.isPending,
      errorMessage: inviteMutation.error?.message ?? '',
      inviteLink,
      emailHint,
      onInvite,
    }),
    [inviteMutation.isPending, inviteMutation.error, inviteLink, emailHint, onInvite],
  );

  return <VueIsland component={InviteMemberFormView} componentProps={formProps} />;
}
