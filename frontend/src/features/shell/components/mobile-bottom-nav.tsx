'use client';

import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/shared/lib/cn';
import type { NavItem } from './app-sidebar';

interface MobileBottomNavProps {
  items: Array<NavItem & { icon: LucideIcon }>;
  onMore?: () => void;
  moreIcon: LucideIcon;
  moreActive?: boolean;
}

export function MobileBottomNav({
  items,
  onMore,
  moreIcon: MoreIcon,
  moreActive,
}: MobileBottomNavProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav className="mobile-nav" aria-label="Мобильная навигация">
      {items.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn('mobile-nav__item', active && 'mobile-nav__item--active')}
            aria-current={active ? 'page' : undefined}
          >
            <Icon strokeWidth={1.75} aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
      {onMore ? (
        <button
          type="button"
          className={cn('mobile-nav__item', moreActive && 'mobile-nav__item--active')}
          onClick={onMore}
        >
          <MoreIcon strokeWidth={1.75} aria-hidden="true" />
          Ещё
        </button>
      ) : null}
    </nav>
  );
}
