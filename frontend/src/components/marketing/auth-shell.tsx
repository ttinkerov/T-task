'use client';

import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { VueIsland } from '@/components/vue/VueIsland';
import { useThemeStore } from '@/stores/theme.store';
import AuthShellView from '@/vue/auth/AuthShellView.vue';
import { LandingBackground } from './landing-background';

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footerPrefix: string;
  footerHref: string;
  footerLinkLabel: string;
}

export function AuthShell({
  title,
  subtitle,
  children,
  footerPrefix,
  footerHref,
  footerLinkLabel,
}: AuthShellProps) {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const [formHost, setFormHost] = useState<HTMLElement | null>(null);

  const onFormHostReady = useCallback((host: HTMLElement | null) => {
    setFormHost(host);
  }, []);

  const viewProps = useMemo(
    () => ({
      title,
      subtitle,
      footerPrefix,
      footerHref,
      footerLinkLabel,
      isLight: theme === 'light',
      onToggleTheme: toggleTheme,
      onFormHostReady,
    }),
    [
      title,
      subtitle,
      footerPrefix,
      footerHref,
      footerLinkLabel,
      theme,
      toggleTheme,
      onFormHostReady,
    ],
  );

  return (
    <div className="tt-landing">
      <LandingBackground />
      <VueIsland component={AuthShellView} componentProps={viewProps} displayContents />
      {formHost ? createPortal(children, formHost) : null}
    </div>
  );
}
