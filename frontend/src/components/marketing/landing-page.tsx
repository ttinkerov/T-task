'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { VueIsland } from '@/components/vue/VueIsland';
import { applyLocale, useLocaleStore, type AppLocale } from '@/stores/locale.store';
import { useThemeStore } from '@/stores/theme.store';
import LandingPageView from '@/vue/marketing/LandingPageView.vue';
import { getLandingCopy } from './landing-copy';
import { Kanban3DScene } from './kanban-3d-scene';

export function LandingPage() {
  const locale = useLocaleStore((state) => state.locale);
  const setLocale = useLocaleStore((state) => state.setLocale);
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const copy = getLandingCopy(locale);
  const [demoHost, setDemoHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    applyLocale(locale);
  }, [locale]);

  const onDemoHostReady = useCallback((el: HTMLElement | null) => {
    setDemoHost(el);
  }, []);

  const onSetLocale = useCallback(
    (next: AppLocale) => {
      setLocale(next);
    },
    [setLocale],
  );

  const componentProps = useMemo(
    () => ({
      copy,
      locale,
      theme,
      onSetLocale,
      onToggleTheme: toggleTheme,
      onDemoHostReady,
    }),
    [copy, locale, theme, onSetLocale, toggleTheme, onDemoHostReady],
  );

  return (
    <>
      <VueIsland component={LandingPageView} componentProps={componentProps} />
      {demoHost ? createPortal(<Kanban3DScene />, demoHost) : null}
    </>
  );
}
