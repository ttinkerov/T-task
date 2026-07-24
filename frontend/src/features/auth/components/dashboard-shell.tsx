'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AppWindow,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Focus,
  FormInput,
  Home,
  Kanban,
  Keyboard,
  LayoutDashboard,
  LayoutTemplate,
  ListChecks,
  ListTodo,
  LogOut,
  Milestone,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  Sparkles,
  Tags,
  Trash2,
  Upload,
  UserRound,
  Bookmark,
} from 'lucide-react';
import { BrandLogo } from '@/components/marketing/brand-logo';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { BoardSkeleton } from '@/components/ui/skeleton';
import { useCanViewActivity } from '@/features/activity/hooks';
import { useLogoutMutation, useMeQuery } from '@/features/auth/hooks';
import { NotificationBell } from '@/features/notifications';
import { usePinnedSavedFiltersQuery } from '@/features/saved-filters/hooks';
import { AppSidebar, type NavGroup } from '@/features/shell/components/app-sidebar';
import { CommandPalette, type CommandItem } from '@/features/shell/components/command-palette';
import { MobileBottomNav } from '@/features/shell/components/mobile-bottom-nav';
import { ShortcutsHelp } from '@/features/shell/components/shortcuts-help';
import {
  dispatchShortcut,
  useShortcutHandlers,
} from '@/features/shell/hooks/use-shortcut-handlers';
import { useCanManageTrash } from '@/features/trash/hooks';
import { WorkspaceSwitcher } from '@/features/workspaces/components/workspace-switcher';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { useWorkspaceRealtime } from '@/shared/realtime';

const COLLAPSE_KEY = 'ttask:sidebar-collapsed';
const FOCUS_CREATE_KEY = 'ttask:focus-create';

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
  useWorkspaceRealtime(workspaceId);
  const logoutMutation = useLogoutMutation();
  const { canView: canViewActivity, isLoading: activityAccessLoading } = useCanViewActivity();
  const { canManage: canManageTrash, isLoading: trashAccessLoading } = useCanManageTrash();
  const { data: pinnedViews = [] } = usePinnedSavedFiltersQuery(workspaceId);
  const [collapsed, setCollapsed] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === '1');
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!isLoading && (isError || !session)) {
      router.replace('/login');
      return;
    }
    if (session && session.workspaces.length === 0) {
      router.replace('/onboarding');
    }
  }, [isError, isLoading, router, session]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const meta = event.metaKey || event.ctrlKey;
      if (meta && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCmdOpen((open) => !open);
      }
      if (event.key === 'Escape' && shortcutsOpen) {
        setShortcutsOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [shortcutsOpen]);

  useShortcutHandlers({
    'create-task': () => {
      if (pathname.startsWith('/dashboard/board')) {
        dispatchShortcut('create-task');
        return;
      }
      try {
        window.sessionStorage.setItem(FOCUS_CREATE_KEY, '1');
      } catch {
        // ignore
      }
      router.push('/dashboard/board');
    },
    'shortcuts-help': () => setShortcutsOpen(true),
  });

  const toggleCollapsed = () => {
    setCollapsed((value) => {
      const next = !value;
      try {
        window.localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    router.replace('/login');
    router.refresh();
  };

  const navGroups: NavGroup[] = useMemo(
    () => [
      {
        id: 'work',
        label: 'Работа',
        items: [
          { href: '/dashboard', label: 'Главная', icon: Home },
          { href: '/dashboard/board', label: 'Задачи', icon: Kanban },
          { href: '/dashboard/all-tasks', label: 'Все задачи', icon: ListTodo },
          { href: '/dashboard/roadmap', label: 'Роадмап', icon: Milestone },
          { href: '/dashboard/my-tasks', label: 'Мои задачи', icon: UserRound },
          { href: '/dashboard/focus', label: 'Фокус', icon: Focus },
          { href: '/dashboard/ai', label: 'ИИ', icon: Sparkles },
        ],
      },
      ...(pinnedViews.length
        ? [
            {
              id: 'views',
              label: 'Виды',
              items: pinnedViews.map((view) => ({
                href:
                  view.view === 'ALL_TASKS'
                    ? `/dashboard/all-tasks?filter=${view.id}`
                    : view.view === 'MY_TASKS'
                      ? `/dashboard/my-tasks?filter=${view.id}`
                      : `/dashboard/board?filter=${view.id}`,
                label: view.name,
                icon: Bookmark,
              })),
            },
          ]
        : []),
      {
        id: 'crm',
        label: 'Рост',
        items: [
          { href: '/dashboard/crm', label: 'CRM', icon: ClipboardList },
          { href: '/dashboard/analytics', label: 'Аналитика', icon: LayoutDashboard },
          { href: '/dashboard/forms', label: 'Формы', icon: FormInput },
        ],
      },
      {
        id: 'system',
        label: 'Система',
        items: [
          { href: '/dashboard/apps', label: 'Приложения', icon: AppWindow },
          { href: '/dashboard/calendar', label: 'iCal', icon: CalendarDays },
          { href: '/dashboard/custom-fields', label: 'Поля', icon: Settings },
          { href: '/dashboard/dod', label: 'DoD', icon: ListChecks },
          { href: '/dashboard/templates', label: 'Шаблоны', icon: LayoutTemplate },
          { href: '/dashboard/import', label: 'Импорт', icon: Upload },
          { href: '/dashboard/tags', label: 'Теги', icon: Tags },
          {
            href: '/dashboard/activity',
            label: 'Журнал',
            icon: Activity,
            hidden: activityAccessLoading || !canViewActivity,
          },
          {
            href: '/dashboard/trash',
            label: 'Корзина',
            icon: Trash2,
            hidden: trashAccessLoading || !canManageTrash,
          },
        ],
      },
    ],
    [activityAccessLoading, canManageTrash, canViewActivity, pinnedViews, trashAccessLoading],
  );

  const commandItems: CommandItem[] = useMemo(() => {
    const navItems = navGroups.flatMap((group) =>
      group.items
        .filter((item) => !item.hidden)
        .map((item) => ({
          id: item.href,
          label: item.label,
          href: item.href,
          icon: item.icon,
          group: 'Навигация',
          keywords: [group.label, item.label],
          hint: undefined as string | undefined,
        })),
    );
    return [
      ...navItems,
      {
        id: 'cmd-board',
        label: 'Открыть задачи',
        href: '/dashboard/board',
        icon: Kanban,
        group: 'Быстрые действия',
        hint: 'B',
      },
      {
        id: 'cmd-create-task',
        label: 'Создать задачу',
        icon: Kanban,
        group: 'Быстрые действия',
        hint: 'C',
        keywords: ['create', 'new', 'задача'],
        action: () => {
          if (pathname.startsWith('/dashboard/board')) {
            dispatchShortcut('create-task');
            return;
          }
          try {
            window.sessionStorage.setItem(FOCUS_CREATE_KEY, '1');
          } catch {
            // ignore
          }
          router.push('/dashboard/board');
        },
      },
      {
        id: 'cmd-shortcuts',
        label: 'Шорткаты',
        icon: Keyboard,
        group: 'Быстрые действия',
        hint: '?',
        keywords: ['keyboard', 'hotkeys', 'справка'],
        action: () => setShortcutsOpen(true),
      },
      {
        id: 'cmd-theme',
        label: 'Переключить тему',
        icon: Settings,
        group: 'Быстрые действия',
        action: () => {
          const current = document.documentElement.getAttribute('data-theme');
          const next = current === 'dark' ? 'light' : 'dark';
          document.documentElement.setAttribute('data-theme', next);
          try {
            window.localStorage.setItem('ttask-theme', next);
          } catch {
            // ignore
          }
        },
      },
      {
        id: 'cmd-logout',
        label: 'Выйти',
        icon: LogOut,
        group: 'Аккаунт',
        action: () => {
          void handleLogout();
        },
      },
    ];
  }, [navGroups, pathname, router]);

  if (isLoading) {
    return (
      <main className="mx-auto flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-4xl">
          <BoardSkeleton />
        </div>
      </main>
    );
  }

  if (isError || !session) {
    return (
      <main className="mx-auto flex min-h-screen items-center justify-center px-6">
        <p className="text-sm text-[var(--tt-text-muted)]">Перенаправление на вход...</p>
      </main>
    );
  }

  const mobileItems = [
    { href: '/dashboard/board', label: 'Задачи', icon: Kanban },
    { href: '/dashboard/all-tasks', label: 'Все', icon: ListTodo },
    { href: '/dashboard/my-tasks', label: 'Мои', icon: UserRound },
    { href: '/dashboard/crm', label: 'CRM', icon: ClipboardList },
  ];

  const settingsHref = workspaceId ? `/dashboard/workspaces/${workspaceId}/settings` : '/dashboard';

  return (
    <div
      className={`app-frame${collapsed ? ' app-frame--collapsed' : ''}${boardMode ? ' app-frame--board' : ''}`}
    >
      <a className="dashboard-skip-link" href="#dashboard-content">
        Перейти к содержимому
      </a>

      <AppSidebar
        groups={navGroups}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapsed}
        CollapseIcon={collapsed ? PanelLeftOpen : PanelLeftClose}
      />

      <header className="app-topbar">
        <div className="app-topbar__left">
          <span className="lg:hidden">
            <BrandLogo href="/dashboard" />
          </span>
          <button
            type="button"
            className="app-topbar__search"
            onClick={() => setCmdOpen(true)}
            aria-label="Открыть командную палитру"
          >
            <Search size={14} strokeWidth={1.75} aria-hidden="true" />
            <span>Поиск и команды</span>
            <kbd>⌘K</kbd>
          </button>
        </div>
        <div className="app-topbar__right">
          <NotificationBell workspaceId={workspaceId} />
          <ThemeToggle />
          <span className="app-topbar__user">{session.user.name}</span>
          <WorkspaceSwitcher />
          <Link
            href={settingsHref}
            className="dashboard-header__icon-btn"
            aria-label="Настройки"
            title="Настройки"
          >
            <Settings size={16} strokeWidth={1.75} />
          </Link>
          <button
            type="button"
            onClick={() => void handleLogout()}
            disabled={logoutMutation.isPending}
            className="dashboard-header__icon-btn"
            title="Выйти"
            aria-label="Выйти"
          >
            <LogOut size={16} strokeWidth={1.75} />
          </button>
        </div>
      </header>

      <main
        id="dashboard-content"
        tabIndex={-1}
        className={`app-main${boardMode ? ' app-main--board' : ''}`}
      >
        {children}
      </main>

      <MobileBottomNav
        items={mobileItems}
        moreIcon={MoreHorizontal}
        moreActive={moreOpen}
        onMore={() => setMoreOpen((value) => !value)}
      />

      {moreOpen ? (
        <div className="mobile-more" role="dialog" aria-label="Ещё разделы">
          <button
            type="button"
            className="mobile-more__backdrop"
            onClick={() => setMoreOpen(false)}
          />
          <div className="mobile-more__sheet">
            <div className="mobile-more__head">
              <strong>Разделы</strong>
              <button
                type="button"
                className="dashboard-header__icon-btn"
                onClick={() => setMoreOpen(false)}
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <div className="mobile-more__links">
              {navGroups
                .flatMap((group) => group.items)
                .filter((item) => !item.hidden)
                .map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`mobile-more__link${active ? ' is-active' : ''}`}
                      onClick={() => setMoreOpen(false)}
                    >
                      <Icon size={16} strokeWidth={1.75} />
                      {item.label}
                      <ChevronLeft size={14} className="opacity-0" />
                    </Link>
                  );
                })}
            </div>
          </div>
        </div>
      ) : null}

      <CommandPalette
        open={cmdOpen}
        onOpenChange={setCmdOpen}
        items={commandItems}
        workspaceId={workspaceId}
      />
      <ShortcutsHelp open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  );
}
