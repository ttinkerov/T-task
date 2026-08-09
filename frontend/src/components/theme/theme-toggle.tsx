'use client';

import { useMemo } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import { useThemeStore } from '@/stores/theme.store';
import ThemeToggleView from '@/vue/theme/ThemeToggle.vue';

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  const viewProps = useMemo(
    () => ({
      isLight: theme === 'light',
      className: className ?? '',
      onToggle: toggleTheme,
    }),
    [theme, className, toggleTheme],
  );

  return <VueIsland component={ThemeToggleView} componentProps={viewProps} />;
}
