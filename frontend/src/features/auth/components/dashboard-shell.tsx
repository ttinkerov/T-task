'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { VueIsland } from '@/components/vue/VueIsland';
import { BoardSkeleton } from '@/components/ui/skeleton';
import { useCanViewActivity } from '@/features/activity/hooks';
import { useLogoutMutation, useMeQuery } from '@/features/auth/hooks';
import { NotificationBell } from '@/features/notifications/components/notification-bell';
import { usePinnedSavedFiltersQuery } from '@/features/saved-filters/hooks';
import { AppSidebar, type NavGroup } from '@/features/shell/components/app-sidebar';
import { CommandPalette, type CommandItem } from '@/features/shell/components/command-palette';
import { DashboardPageTransition } from '@/features/shell/components/dashboard-page-transition';
import { MobileBottomNav } from '@/features/shell/components/mobile-bottom-nav';
import { MobileMoreSheet } from '@/features/shell/components/mobile-more-sheet';
import { ShortcutsHelp } from '@/features/shell/components/shortcuts-help';
import {
  dispatchShortcut,
  useShortcutHandlers,
} from '@/features/shell/hooks/use-shortcut-handlers';
import { useCanManageTrash } from '@/features/trash/hooks';
import { WorkspaceSwitcher } from '@/features/workspaces/components/workspace-switcher';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { useThemeStore } from '@/stores/theme.store';
import { useWorkspaceRealtime } from '@/shared/realtime';
import AppTopbarView from '@/vue/shell/AppTopbar.vue';

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
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const { canView: canViewActivity, isLoading: activityAccessLoading } = useCanViewActivity();
  const { canManage: canManageTrash, isLoading: trashAccessLoading } = useCanManageTrash();
  const { data: pinnedViews = [] } = usePinnedSavedFiltersQuery(workspaceId);
  const [collapsed, setCollapsed] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [topbarHosts, setTopbarHosts] = useState<{
    bell: HTMLElement | null;
    switcher: HTMLElement | null;
  }>({ bell: null, switcher: null });

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === '1');
    } catch {
      /* ignore */
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
        /* ignore */
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
        /* ignore */
      }
      return next;
    });
  };

  const handleLogout = useCallback(async () => {
    await logoutMutation.mutateAsync();
    router.replace('/login');
    router.refresh();
  }, [logoutMutation, router]);

  const onHostsReady = useCallback(
    (hosts: { bell: HTMLElement | null; switcher: HTMLElement | null }) => {
      setTopbarHosts(hosts);
    },
    [],
  );

  const settingsHref = workspaceId ? `/dashboard/workspaces/${workspaceId}/settings` : '/dashboard';

  const topbarProps = useMemo(
    () => ({
      userName: session?.user.name ?? '',
      settingsHref,
      logoutPending: logoutMutation.isPending,
      isLight: theme === 'light',
      onOpenSearch: () => setCmdOpen(true),
      onToggleTheme: toggleTheme,
      onLogout: () => void handleLogout(),
      onHostsReady,
    }),
    [
      session?.user.name,
      settingsHref,
      logoutMutation.isPending,
      theme,
      toggleTheme,
      handleLogout,
      onHostsReady,
    ],
  );

  const navGroups: NavGroup[] = useMemo(
    () => [
      {
        id: 'work',
        label: 'Работа',
        items: [
          { href: '/dashboard', label: 'Главная', iconKey: 'home' },
          { href: '/dashboard/board', label: 'Задачи', iconKey: 'kanban' },
          { href: '/dashboard/all-tasks', label: 'Все задачи', iconKey: 'list-todo' },
          { href: '/dashboard/my-tasks', label: 'Мои задачи', iconKey: 'user' },
          { href: '/dashboard/roadmap', label: 'Роадмап', iconKey: 'milestone' },
          { href: '/dashboard/epic-board', label: 'Эпик-борд', iconKey: 'sticky' },
          { href: '/dashboard/whiteboard', label: 'Доска', iconKey: 'pen' },
          { href: '/dashboard/focus', label: 'Фокус', iconKey: 'focus' },
          { href: '/dashboard/ai', label: 'ИИ', iconKey: 'sparkles' },
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
                iconKey: 'bookmark',
              })),
            },
          ]
        : []),
      {
        id: 'growth',
        label: 'Рост',
        items: [
          { href: '/dashboard/crm', label: 'CRM', iconKey: 'clipboard' },
          { href: '/dashboard/analytics', label: 'Аналитика', iconKey: 'layout' },
        ],
      },
      {
        id: 'more',
        label: 'Ещё',
        collapsible: true,
        defaultOpen: false,
        items: [
          { href: '/dashboard/forms', label: 'Формы', iconKey: 'form' },
          { href: '/dashboard/apps', label: 'Приложения', iconKey: 'apps' },
          { href: '/dashboard/calendar', label: 'Календарь', iconKey: 'calendar' },
          { href: '/dashboard/custom-fields', label: 'Поля', iconKey: 'settings' },
          { href: '/dashboard/dod', label: 'Готовность', iconKey: 'checks' },
          { href: '/dashboard/templates', label: 'Шаблоны', iconKey: 'template' },
          { href: '/dashboard/import', label: 'Импорт', iconKey: 'upload' },
          { href: '/dashboard/tags', label: 'Теги', iconKey: 'tags' },
          {
            href: '/dashboard/activity',
            label: 'Журнал',
            iconKey: 'activity',
            hidden: activityAccessLoading || !canViewActivity,
          },
          {
            href: '/dashboard/trash',
            label: 'Корзина',
            iconKey: 'trash',
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
          iconKey: item.iconKey,
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
        iconKey: 'kanban',
        group: 'Быстрые действия',
        hint: 'B',
      },
      {
        id: 'cmd-create-task',
        label: 'Создать задачу',
        iconKey: 'kanban',
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
            /* ignore */
          }
          router.push('/dashboard/board');
        },
      },
      {
        id: 'cmd-shortcuts',
        label: 'Шорткаты',
        iconKey: 'keyboard',
        group: 'Быстрые действия',
        hint: '?',
        keywords: ['keyboard', 'hotkeys', 'справка'],
        action: () => setShortcutsOpen(true),
      },
      {
        id: 'cmd-theme',
        label: 'Переключить тему',
        iconKey: 'settings',
        group: 'Быстрые действия',
        action: () => {
          const current = document.documentElement.getAttribute('data-theme');
          const next = current === 'dark' ? 'light' : 'dark';
          document.documentElement.setAttribute('data-theme', next);
          try {
            window.localStorage.setItem('ttask-theme', next);
          } catch {
            /* ignore */
          }
        },
      },
      {
        id: 'cmd-logout',
        label: 'Выйти',
        iconKey: 'logout',
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
    { href: '/dashboard/board', label: 'Задачи', iconKey: 'kanban' },
    { href: '/dashboard/all-tasks', label: 'Все', iconKey: 'list-todo' },
    { href: '/dashboard/my-tasks', label: 'Мои', iconKey: 'user' },
    { href: '/dashboard/crm', label: 'CRM', iconKey: 'clipboard' },
  ];

  return (
    <div
      className={`app-frame${collapsed ? ' app-frame--collapsed' : ''}${boardMode ? ' app-frame--board' : ''}`}
    >
      <a className="dashboard-skip-link" href="#dashboard-content">
        Перейти к содержимому
      </a>

      <AppSidebar groups={navGroups} collapsed={collapsed} onToggleCollapse={toggleCollapsed} />

      <VueIsland component={AppTopbarView} componentProps={topbarProps} displayContents />
      {topbarHosts.bell
        ? createPortal(<NotificationBell workspaceId={workspaceId} />, topbarHosts.bell)
        : null}
      {topbarHosts.switcher ? createPortal(<WorkspaceSwitcher />, topbarHosts.switcher) : null}

      <main
        id="dashboard-content"
        tabIndex={-1}
        className={`app-main${boardMode ? ' app-main--board' : ''}`}
      >
        <DashboardPageTransition fill={boardMode}>{children}</DashboardPageTransition>
      </main>

      <MobileBottomNav
        items={mobileItems}
        moreActive={moreOpen}
        onMore={() => setMoreOpen((value) => !value)}
      />

      <MobileMoreSheet
        open={moreOpen}
        items={navGroups.flatMap((group) => group.items)}
        onClose={() => setMoreOpen(false)}
      />

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
