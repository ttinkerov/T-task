'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { VueIsland } from '@/components/vue/VueIsland';
import MobileBottomNavView from '@/vue/shell/MobileBottomNav.vue';

interface MobileNavItem {
  href: string;
  label: string;
  iconKey: string;
}

interface MobileBottomNavProps {
  items: MobileNavItem[];
  onMore?: () => void;
  moreActive?: boolean;
}

export function MobileBottomNav({ items, onMore, moreActive }: MobileBottomNavProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const viewProps = useMemo(
    () => ({
      items: items.map((item) => ({
        ...item,
        active: isActive(item.href),
      })),
      showMore: Boolean(onMore),
      moreActive: Boolean(moreActive),
      onMore,
    }),
    [items, onMore, moreActive, pathname],
  );

  return <VueIsland component={MobileBottomNavView} componentProps={viewProps} />;
}
