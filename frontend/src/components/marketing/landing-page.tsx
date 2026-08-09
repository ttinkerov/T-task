'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import { applyLocale, useLocaleStore, type AppLocale } from '@/stores/locale.store';
import { useThemeStore } from '@/stores/theme.store';
import LandingPageView from '@/vue/marketing/LandingPageView.vue';
import { getLandingCopy } from './landing-copy';

export function LandingPage() {
  const locale = useLocaleStore((state) => state.locale);
  const setLocale = useLocaleStore((state) => state.setLocale);
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const copy = getLandingCopy(locale);

  useEffect(() => {
    applyLocale(locale);
  }, [locale]);

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
    }),
    [copy, locale, theme, onSetLocale, toggleTheme],
  );

  return <VueIsland component={LandingPageView} componentProps={componentProps} />;
}
