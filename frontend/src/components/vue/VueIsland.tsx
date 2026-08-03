'use client';

import { useEffect, useRef } from 'react';
import type { Component } from 'vue';
import { mountVueApp, type MountedVueApp } from '@/vue/mountVueApp';

type Props = {
  component: Component;
  componentProps?: Record<string, unknown>;
};

/** React-холст: Vue монтируется один раз, props обновляются отдельно. */
export function VueIsland({ component, componentProps }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<MountedVueApp | null>(null);
  const propsRef = useRef(componentProps);
  propsRef.current = componentProps;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const mounted = mountVueApp(host, component, propsRef.current);
    appRef.current = mounted;

    return () => {
      mounted.unmount();
      appRef.current = null;
    };
  }, [component]);

  useEffect(() => {
    appRef.current?.update(componentProps);
  }, [componentProps]);

  return <div ref={hostRef} />;
}
