'use client';

import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { VueIsland } from '@/components/vue/VueIsland';
import ViewModeTransitionView from '@/vue/shell/ViewModeTransition.vue';

function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function ViewModeTransition({
  modeKey,
  children,
  className,
}: {
  modeKey: string;
  children: ReactNode;
  className?: string;
}) {
  const [host, setHost] = useState<HTMLElement | null>(null);
  const onHostReady = useCallback((el: HTMLElement | null) => setHost(el), []);

  const viewProps = useMemo(
    () => ({
      modeKey,
      className: className ?? '',
      reduceMotion: prefersReducedMotion(),
      onHostReady,
    }),
    [modeKey, className, onHostReady],
  );

  return (
    <>
      <VueIsland component={ViewModeTransitionView} componentProps={viewProps} displayContents />
      {host ? createPortal(children, host) : null}
    </>
  );
}
