'use client';

import { useCallback, useMemo, useState } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import ForgotPasswordFormView from '@/vue/auth/ForgotPasswordForm.vue';
import { useForgotPasswordMutation } from '../hooks';

export function ForgotPasswordForm() {
  const mutation = useForgotPasswordMutation();
  const [success, setSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  const onSubmit = useCallback(
    async (payload: { email: string }) => {
      setSuccess('');
      setActionError('');
      try {
        await mutation.mutateAsync(payload);
        setSuccess(
          'Если аккаунт с таким email есть, мы отправили письмо со ссылкой. Проверьте почту.',
        );
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Не удалось отправить письмо');
      }
    },
    [mutation],
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

  return <VueIsland component={ForgotPasswordFormView} componentProps={viewProps} />;
}
