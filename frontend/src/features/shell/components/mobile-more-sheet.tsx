'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { VueIsland } from '@/components/vue/VueIsland';
import MobileMoreSheetView from '@/vue/shell/MobileMoreSheet.vue';
import type { NavItem } from './app-sidebar';

export function MobileMoreSheet({
  open,
  items,
  onClose,
}: {
  open: boolean;
  items: NavItem[];
  onClose: () => void;
}) {
  const pathname = usePathname();

  const viewProps = useMemo(
    () => ({
      open,
      items: items
        .filter((item) => !item.hidden)
        .map((item) => ({
          href: item.href,
          label: item.label,
          iconKey: item.iconKey,
          active: pathname === item.href || pathname.startsWith(`${item.href}/`),
        })),
      onClose,
    }),
    [open, items, onClose, pathname],
  );

  if (!open) return null;

  return <VueIsland component={MobileMoreSheetView} componentProps={viewProps} />;
}
