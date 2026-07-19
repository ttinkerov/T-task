'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { BrandLogo } from '@/components/marketing/brand-logo';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { useCanViewActivity } from '@/features/activity/hooks';
import { useLogoutMutation, useMeQuery } from '@/features/auth/hooks';
import { NotificationBell } from '@/features/notifications';
import { useCanManageTrash } from '@/features/trash/hooks';
import { WorkspaceSwitcher } from '@/features/workspaces/components/workspace-switcher';
import { useWorkspaceStore } from '@/stores/workspace.store';

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
  const workspaceId = useWorkspaceStore((state) => state.currentWorkspaceId);
  const logoutMutation = useLogoutMutation();
  const { canView: canViewActivity, isLoading: activityAccessLoading } = useCanViewActivity();
  const { canManage: canManageTrash, isLoading: trashAccessLoading } = useCanManageTrash();

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

  const isNavActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const navLinkClass = (href: string) =>
    `dashboard-header__nav-link${isNavActive(href) ? ' dashboard-header__nav-link--active' : ''}`;

  return (
    <div className="app-shell min-h-screen">
      <a className="dashboard-skip-link" href="#dashboard-content">
        Перейти к содержимому
      </a>
      <header className="dashboard-header">
        <div className="dashboard-header__inner">
          <div className="dashboard-header__left">
            <BrandLogo href="/dashboard" className="dashboard-header__logo" />
            <nav className="dashboard-header__nav" aria-label="Основная навигация">
              <Link
                href="/dashboard"
                className={navLinkClass('/dashboard')}
                aria-current={isNavActive('/dashboard') ? 'page' : undefined}
              >
                Главная
              </Link>
              <Link
                href="/dashboard/board"
                className={navLinkClass('/dashboard/board')}
                aria-current={isNavActive('/dashboard/board') ? 'page' : undefined}
              >
                Доска
              </Link>
              <Link
                href="/dashboard/all-tasks"
                className={navLinkClass('/dashboard/all-tasks')}
                aria-current={isNavActive('/dashboard/all-tasks') ? 'page' : undefined}
              >
                Все задачи
              </Link>
              <Link
                href="/dashboard/analytics"
                className={navLinkClass('/dashboard/analytics')}
                aria-current={isNavActive('/dashboard/analytics') ? 'page' : undefined}
              >
                Аналитика
              </Link>
              <Link
                href="/dashboard/crm"
                className={navLinkClass('/dashboard/crm')}
                aria-current={isNavActive('/dashboard/crm') ? 'page' : undefined}
              >
                CRM
              </Link>
              <Link
                href="/dashboard/forms"
                className={navLinkClass('/dashboard/forms')}
                aria-current={isNavActive('/dashboard/forms') ? 'page' : undefined}
              >
                Формы
              </Link>
              <Link
                href="/dashboard/apps"
                className={navLinkClass('/dashboard/apps')}
                aria-current={isNavActive('/dashboard/apps') ? 'page' : undefined}
              >
                Приложения
              </Link>
              <Link
                href="/dashboard/calendar"
                className={navLinkClass('/dashboard/calendar')}
                aria-current={isNavActive('/dashboard/calendar') ? 'page' : undefined}
              >
                Календарь
              </Link>
              <Link
                href="/dashboard/custom-fields"
                className={navLinkClass('/dashboard/custom-fields')}
                aria-current={isNavActive('/dashboard/custom-fields') ? 'page' : undefined}
              >
                Поля
              </Link>
              {!activityAccessLoading && canViewActivity ? (
                <Link
                  href="/dashboard/activity"
                  className={navLinkClass('/dashboard/activity')}
                  aria-current={isNavActive('/dashboard/activity') ? 'page' : undefined}
                >
                  Журнал
                </Link>
              ) : null}
              {!trashAccessLoading && canManageTrash ? (
                <Link
                  href="/dashboard/trash"
                  className={navLinkClass('/dashboard/trash')}
                  aria-current={isNavActive('/dashboard/trash') ? 'page' : undefined}
                >
                  Корзина
                </Link>
              ) : null}
              <Link
                href="/dashboard/focus"
                className={navLinkClass('/dashboard/focus')}
                aria-current={isNavActive('/dashboard/focus') ? 'page' : undefined}
              >
                Фокус
              </Link>
            </nav>
          </div>

          <div className="dashboard-header__right">
            <NotificationBell workspaceId={workspaceId} />
            <ThemeToggle />
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
              <span aria-hidden="true">↗</span>
            </button>
          </div>
        </div>
      </header>

      <main
        id="dashboard-content"
        tabIndex={-1}
        className={`dashboard-main${boardMode ? ' dashboard-main--board' : ''}`}
      >
        {children}
      </main>
    </div>
  );
}
