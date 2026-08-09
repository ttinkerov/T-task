'use client';

import { useEffect, useRef, useState } from 'react';
import type { Component } from 'vue';
import { mountVueApp, type MountedVueApp } from '@/vue/mountVueApp';

type Props = {
  component: Component;
  componentProps?: Record<string, unknown>;
  displayContents?: boolean;
};

export function VueIsland({ component, componentProps, displayContents = false }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<MountedVueApp | null>(null);
  const propsRef = useRef(componentProps);
  propsRef.current = componentProps;
  const [mountState, setMountState] = useState({ error: false, key: 0 });

  useEffect(() => {
    if (mountState.error) return;

    const host = hostRef.current;
    if (!host) return;

    try {
      const mounted = mountVueApp(host, component, propsRef.current);
      appRef.current = mounted;
      return () => {
        mounted.unmount();
        appRef.current = null;
      };
    } catch (error) {
      console.error('[VueIsland] mount failed', error);
      setMountState((current) => ({ ...current, error: true }));
      return undefined;
    }
  }, [component, mountState.error, mountState.key]);

  useEffect(() => {
    if (mountState.error) return;
    appRef.current?.update(componentProps);
  }, [componentProps, mountState.error]);

  if (mountState.error) {
    return (
      <div className="text-sm" role="alert">
        <p className="text-red-400">Не удалось отобразить блок интерфейса.</p>
        <button
          type="button"
          className="board-filters__chip"
          onClick={() => setMountState((current) => ({ error: false, key: current.key + 1 }))}
        >
          Повторить
        </button>
      </div>
    );
  }

  return (
    <div
      key={mountState.key}
      ref={hostRef}
      style={displayContents ? { display: 'contents' } : undefined}
    />
  );
}
