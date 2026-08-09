'use client';

import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { VueIsland } from '@/components/vue/VueIsland';
import DashboardPageTransitionView from '@/vue/shell/DashboardPageTransition.vue';

function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function DashboardPageTransition({
  children,
  fill = false,
}: {
  children: ReactNode;
  fill?: boolean;
}) {
  const pathname = usePathname();
  const [host, setHost] = useState<HTMLElement | null>(null);
  const onHostReady = useCallback((el: HTMLElement | null) => setHost(el), []);

  const viewProps = useMemo(
    () => ({
      pathKey: pathname,
      fill,
      reduceMotion: prefersReducedMotion(),
      onHostReady,
    }),
    [pathname, fill, onHostReady],
  );

  return (
    <>
      <VueIsland
        component={DashboardPageTransitionView}
        componentProps={viewProps}
        displayContents
      />
      {host ? createPortal(children, host) : null}
    </>
  );
}
