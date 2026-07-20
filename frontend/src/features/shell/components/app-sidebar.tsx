'use client';

import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BrandLogo } from '@/components/marketing/brand-logo';
import { cn } from '@/shared/lib/cn';

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
}

interface AppSidebarProps {
  groups: NavGroup[];
  collapsed: boolean;
  onToggleCollapse: () => void;
  CollapseIcon: LucideIcon;
}

export function AppSidebar({ groups, collapsed, onToggleCollapse, CollapseIcon }: AppSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname === href || pathname.startsWith(`${href}/`);
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
          return (
            <div key={group.id}>
              <p className="app-sidebar__group-label">{group.label}</p>
              <div className="app-sidebar__links">
                {visible.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
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
