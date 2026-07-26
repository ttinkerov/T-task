'use client';

import { motion } from 'framer-motion';
import { ChevronDown, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { BrandLogo } from '@/components/marketing/brand-logo';
import { cn } from '@/shared/lib/cn';

const GROUP_OPEN_KEY = 'ttask:nav-group-open';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
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
  CollapseIcon: LucideIcon;
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

export function AppSidebar({ groups, collapsed, onToggleCollapse, CollapseIcon }: AppSidebarProps) {
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

  const toggleGroup = (groupId: string) => {
    setOpenById((prev) => {
      const group = groups.find((entry) => entry.id === groupId);
      const currentlyOpen = group ? isGroupOpen(group) : Boolean(prev[groupId]);
      const next = { ...prev, [groupId]: !currentlyOpen };
      writeStoredOpen(next);
      return next;
    });
  };

  return (
    <aside className="app-sidebar" aria-label="Боковая навигация">
      <div className="app-sidebar__brand">
        <BrandLogo href="/dashboard" />
        <button
          type="button"
          className="app-sidebar__collapse"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Развернуть меню' : 'Свернуть меню'}
          title={collapsed ? 'Развернуть' : 'Свернуть'}
        >
          <CollapseIcon size={16} strokeWidth={1.75} />
        </button>
      </div>

      <nav className="app-sidebar__nav">
        {groups.map((group) => {
          const visible = group.items.filter((item) => !item.hidden);
          if (visible.length === 0) return null;

          const isCollapsible = Boolean(group.collapsible);
          const isOpen = isGroupOpen(group);
          const panelId = `nav-group-${group.id}`;

          return (
            <div
              key={group.id}
              className={cn(
                'app-sidebar__group',
                isCollapsible && 'app-sidebar__group--collapsible',
                isOpen && 'app-sidebar__group--open',
              )}
            >
              {isCollapsible && !collapsed ? (
                <button
                  type="button"
                  className="app-sidebar__group-toggle"
                  onClick={() => toggleGroup(group.id)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                >
                  <span className="app-sidebar__group-label">{group.label}</span>
                  <ChevronDown
                    className="app-sidebar__group-chevron"
                    size={14}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                </button>
              ) : (
                <p className="app-sidebar__group-label">{group.label}</p>
              )}

              <div
                id={panelId}
                className="app-sidebar__links"
                hidden={!isOpen}
                role={isCollapsible ? 'region' : undefined}
                aria-label={isCollapsible ? group.label : undefined}
              >
                {visible.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={`${group.id}-${item.href}`}
                      href={item.href}
                      className={cn('app-sidebar__link', active && 'app-sidebar__link--active')}
                      aria-current={active ? 'page' : undefined}
                      title={collapsed ? item.label : undefined}
                    >
                      {active ? (
                        <motion.span
                          layoutId="nav-ink"
                          className="sr-only"
                          transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                        />
                      ) : null}
                      <Icon size={17} strokeWidth={1.75} aria-hidden="true" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
