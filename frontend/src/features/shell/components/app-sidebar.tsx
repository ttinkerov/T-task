'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { VueIsland } from '@/components/vue/VueIsland';
import AppSidebarView from '@/vue/shell/AppSidebar.vue';

const GROUP_OPEN_KEY = 'ttask:nav-group-open';

export interface NavItem {
  href: string;
  label: string;
  iconKey: string;
  hidden?: boolean;
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
  collapsible?: boolean;
  defaultOpen?: boolean;
}

interface AppSidebarProps {
  groups: NavGroup[];
  collapsed: boolean;
  onToggleCollapse: () => void;
}

function readStoredOpen(): Record<string, boolean> {
  try {
    const raw = window.localStorage.getItem(GROUP_OPEN_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as Record<string, boolean>;
  } catch {
    return {};
  }
}

function writeStoredOpen(next: Record<string, boolean>) {
  try {
    window.localStorage.setItem(GROUP_OPEN_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function AppSidebar({ groups, collapsed, onToggleCollapse }: AppSidebarProps) {
  const pathname = usePathname();
  const [openById, setOpenById] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setOpenById(readStoredOpen());
  }, []);

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    const pathOnly = href.split('?')[0] ?? href;
    return pathname === pathOnly || pathname.startsWith(`${pathOnly}/`);
  };

  const groupHasActive = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const group of groups) {
      map[group.id] = group.items.some((item) => !item.hidden && isActive(item.href));
    }
    return map;
  }, [groups, pathname]);

  const isGroupOpen = (group: NavGroup) => {
    if (collapsed || !group.collapsible) return true;
    if (groupHasActive[group.id]) return true;
    if (typeof openById[group.id] === 'boolean') return openById[group.id];
    return group.defaultOpen ?? false;
  };

  const onToggleGroup = (groupId: string) => {
    setOpenById((prev) => {
      const group = groups.find((entry) => entry.id === groupId);
      const currentlyOpen = group ? isGroupOpen(group) : Boolean(prev[groupId]);
      const next = { ...prev, [groupId]: !currentlyOpen };
      writeStoredOpen(next);
      return next;
    });
  };

  const viewGroups = useMemo(
    () =>
      groups.map((group) => ({
        id: group.id,
        label: group.label,
        collapsible: Boolean(group.collapsible),
        open: isGroupOpen(group),
        items: group.items.map((item) => ({
          href: item.href,
          label: item.label,
          iconKey: item.iconKey,
          hidden: Boolean(item.hidden),
          active: isActive(item.href),
        })),
      })),
    [groups, openById, collapsed, pathname, groupHasActive],
  );

  const viewProps = useMemo(
    () => ({
      groups: viewGroups,
      collapsed,
      onToggleCollapse,
      onToggleGroup,
    }),
    [viewGroups, collapsed, onToggleCollapse],
  );

  return <VueIsland component={AppSidebarView} componentProps={viewProps} />;
}
