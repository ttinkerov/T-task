'use client';

import { DashboardShell } from '@/features/auth/components/dashboard-shell';
import { PomodoroTimer } from '@/components/pomodoro/pomodoro-timer';
import { useWorkspacesQuery } from '@/features/workspaces/hooks';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function FocusPage() {
  const router = useRouter();
  const { data: workspaces = [], isLoading } = useWorkspacesQuery();

  useEffect(() => {
    if (!isLoading && workspaces.length === 0) {
      router.replace('/onboarding');
    }
  }, [isLoading, router, workspaces.length]);

  return (
    <DashboardShell>
      <PomodoroTimer />
    </DashboardShell>
  );
}
