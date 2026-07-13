'use client';

import { useMeQuery } from '@/features/auth/hooks';
import { OnboardingWizard } from '@/features/onboarding/components/onboarding-wizard';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, isLoading, isError } = useMeQuery();

  useEffect(() => {
    if (!isLoading && (isError || !session)) {
      router.replace('/login');
      return;
    }

    if (session && session.workspaces.length > 0) {
      router.replace('/dashboard/board');
    }
  }, [isError, isLoading, router, session]);

  if (isLoading || !session) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg items-center justify-center px-6">
        <p className="text-sm text-muted-foreground">Загрузка...</p>
      </main>
    );
  }

  if (session.workspaces.length > 0) {
    return null;
  }

  return (
    <main
      className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-12"
      style={{ background: '#000000', color: '#fff' }}
    >
      <OnboardingWizard />
    </main>
  );
}
