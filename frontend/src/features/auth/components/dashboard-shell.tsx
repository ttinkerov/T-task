'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useLogoutMutation, useMeQuery } from '@/features/auth/hooks';
import { WorkspaceSwitcher } from '@/features/workspaces/components/workspace-switcher';

export function DashboardShell({
  children,
  boardMode = false,
}: {
  children: React.ReactNode;
  boardMode?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isLoading, isError } = useMeQuery();
  const logoutMutation = useLogoutMutation();

  useEffect(() => {
    if (!isLoading && (isError || !session)) {
      router.replace('/login');
      return;
    }

    if (session && session.workspaces.length === 0) {
      router.replace('/onboarding');
    }
  }, [isError, isLoading, router, session]);

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    router.replace('/login');
    router.refresh();
  };

  if (isLoading) {
    return (
      <main className="mx-auto flex min-h-screen items-center justify-center px-6">
        <p className="text-sm text-muted-foreground">Загрузка сессии...</p>
      </main>
    );
  }

  if (isError || !session) {
    return (
      <main className="mx-auto flex min-h-screen items-center justify-center px-6">
        <p className="text-sm text-muted-foreground">Перенаправление на вход...</p>
      </main>
    );
  }

  const navLinkClass = (href: string) =>
    `dashboard-header__nav-link${pathname === href || pathname.startsWith(`${href}/`) ? ' dashboard-header__nav-link--active' : ''}`;

  return (
    <div className="min-h-screen" style={{ background: '#000000', color: '#fff' }}>
      <header className="dashboard-header">
        <div className="dashboard-header__inner">
          <div className="dashboard-header__left">
            <Link href="/dashboard" className="dashboard-header__logo tt-logo">
              T-task
            </Link>
            <nav className="dashboard-header__nav">
              <Link href="/dashboard" className={navLinkClass('/dashboard')}>
                Главная
              </Link>
              <Link href="/dashboard/board" className={navLinkClass('/dashboard/board')}>
                Доска
              </Link>
            </nav>
          </div>

          <div className="dashboard-header__right">
            <span className="dashboard-header__user">{session.user.name}</span>
            <WorkspaceSwitcher />
            <button
              type="button"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              className="dashboard-header__icon-btn"
              title="Выйти"
              aria-label="Выйти"
            >
              ↗
            </button>
          </div>
        </div>
      </header>

      <main className={`dashboard-main${boardMode ? ' dashboard-main--board' : ''}`}>
        {children}
      </main>
    </div>
  );
}
