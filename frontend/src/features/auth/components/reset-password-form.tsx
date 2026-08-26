'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { VueIsland } from '@/components/vue/VueIsland';
import ResetPasswordFormView from '@/vue/auth/ResetPasswordForm.vue';
import { useResetPasswordMutation } from '../hooks';

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const mutation = useResetPasswordMutation();
  const [success, setSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  const onSubmit = useCallback(
    async (payload: { password: string }) => {
      setSuccess('');
      setActionError('');
      try {
        await mutation.mutateAsync({ token, password: payload.password });
        setSuccess('Пароль обновлён. Можно войти.');
        window.setTimeout(() => {
          router.push('/login');
          router.refresh();
        }, 1200);
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Не удалось сбросить пароль');
      }
    },
    [mutation, router, token],
  );

  const viewProps = useMemo(
    () => ({
      pending: mutation.isPending,
      error: actionError,
      success,
      onSubmit,
    }),
    [mutation.isPending, actionError, success, onSubmit],
  );

  return <VueIsland component={ResetPasswordFormView} componentProps={viewProps} />;
}
