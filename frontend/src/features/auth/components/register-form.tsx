'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import RegisterFormView from '@/vue/auth/RegisterForm.vue';
import { useRegisterMutation } from '../hooks';

export function RegisterForm() {
  const router = useRouter();
  const registerMutation = useRegisterMutation();

  const onSubmit = useCallback(
    async (payload: { name: string; email: string; password: string }) => {
      await registerMutation.mutateAsync(payload);
      router.push('/onboarding');
      router.refresh();
    },
    [registerMutation, router],
  );

  const viewProps = useMemo(
    () => ({
      pending: registerMutation.isPending,
      error: registerMutation.error?.message ?? '',
      onSubmit,
    }),
    [registerMutation.isPending, registerMutation.error?.message, onSubmit],
  );

  return <VueIsland component={RegisterFormView} componentProps={viewProps} />;
}
