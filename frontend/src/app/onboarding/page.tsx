'use client';

import { useMeQuery } from '@/features/auth/hooks';
import { OnboardingWizard } from '@/features/onboarding/components/onboarding-wizard';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, isLoading, isError } = useMeQuery();
  /** Snapshot from first loaded session — ignore workspaces created mid-wizard. */
  const hadWorkspacesOnLoad = useRef<boolean | null>(null);

  if (session && hadWorkspacesOnLoad.current === null) {
    hadWorkspacesOnLoad.current = session.workspaces.length > 0;
  }

  useEffect(() => {
    if (isLoading) return;

    if (isError || !session) {
      router.replace('/login');
      return;
    }

    if (hadWorkspacesOnLoad.current) {
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

  if (hadWorkspacesOnLoad.current) {
    return null;
  }

  return (
    <main className="onboarding-page">
      <OnboardingWizard />
    </main>
  );
}
