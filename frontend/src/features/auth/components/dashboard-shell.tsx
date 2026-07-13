'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useLogoutMutation, useMeQuery } from '@/features/auth/hooks';
import { WorkspaceSwitcher } from '@/features/workspaces/components/workspace-switcher';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, isLoading, isError } = useMeQuery();
  const logoutMutation = useLogoutMutation();

  useEffect(() => {
    if (!isLoading && (isError || !session)) {
      router.replace('/login');
    }
  }, [isError, isLoading, router, session]);

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    router.replace('/login');
    router.refresh();
  };

  if (isLoading) {
    return (
      <main className="mx-auto flex min-h-screen max-w-4xl items-center justify-center bg-background px-6">
        <p className="text-sm text-muted-foreground">Загрузка сессии...</p>
      </main>
    );
  }

  if (isError || !session) {
    return (
      <main className="mx-auto flex min-h-screen max-w-4xl items-center justify-center bg-background px-6">
        <p className="text-sm text-muted-foreground">Перенаправление на вход...</p>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="space-y-2">
            <p className="text-sm font-normal" style={{ fontFamily: "'Instrument Serif', serif" }}>
              T-task
            </p>
            <p className="font-medium">{session.user.name}</p>
            <WorkspaceSwitcher />
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            className="btn-ghost"
          >
            Выйти
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-8">{children}</main>
    </div>
  );
}
