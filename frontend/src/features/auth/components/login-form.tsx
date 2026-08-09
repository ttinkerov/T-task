'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import { getSafeRedirectPath } from '@/shared/lib/safe-redirect';
import LoginFormView from '@/vue/auth/LoginForm.vue';
import { useLoginMutation } from '../hooks';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const loginMutation = useLoginMutation();

  const onSubmit = useCallback(
    async (payload: { email: string; password: string }) => {
      const session = await loginMutation.mutateAsync(payload);
      const defaultDestination =
        session && session.workspaces.length === 0 ? '/onboarding' : '/dashboard/board';
      const destination = getSafeRedirectPath(searchParams.get('next'), defaultDestination);
      router.push(destination);
      router.refresh();
    },
    [loginMutation, router, searchParams],
  );

  const viewProps = useMemo(
    () => ({
      pending: loginMutation.isPending,
      error: loginMutation.error?.message ?? '',
      onSubmit,
    }),
    [loginMutation.isPending, loginMutation.error?.message, onSubmit],
  );

  return <VueIsland component={LoginFormView} componentProps={viewProps} />;
}
