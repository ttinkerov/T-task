'use client';

import { useEffect, useRef } from 'react';
import type { Component } from 'vue';
import { mountVueApp } from '@/vue/mountVueApp';

type Props = {
  component: Component;
  componentProps?: Record<string, unknown>;
};

// React только держит пустой div; внутрь монтируем Vue
export function VueIsland({ component, componentProps }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const unmount = mountVueApp(host, component, componentProps);
    return unmount;
  }, [component, componentProps]);

  return <div ref={hostRef} />;
}
