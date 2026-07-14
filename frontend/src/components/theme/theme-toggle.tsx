'use client';

import { cn } from '@/shared/lib/cn';
import { useThemeStore } from '@/stores/theme.store';

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const isLight = theme === 'light';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn('theme-toggle', className)}
      aria-label={isLight ? 'Включить тёмную тему' : 'Включить светлую тему'}
      title={isLight ? 'Тёмная тема' : 'Светлая тема'}
    >
      <span className="theme-toggle__icon" aria-hidden="true">
        {isLight ? (
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 2a1 1 0 0 1 1 1v1.5a1 1 0 1 1-2 0V3a1 1 0 0 1 1-1Zm5.657 2.343a1 1 0 0 1 0 1.414L15.192 6.57a1 1 0 1 1-1.414-1.414l1.465-1.465a1 1 0 0 1 1.414 0ZM17 9a1 1 0 0 1 1 1v.5a1 1 0 1 1-2 0V10a1 1 0 0 1 1-1Zm-2.343 5.657a1 1 0 0 1 1.414 0l1.465 1.465a1 1 0 1 1-1.414 1.414L15.192 16.07a1 1 0 0 1 0-1.414ZM10 15.5a1 1 0 0 1 1 1V18a1 1 0 1 1-2 0v-1.5a1 1 0 0 1 1-1ZM4.05 15.192a1 1 0 0 1 1.414 1.414L3.999 17.96a1 1 0 1 1-1.414-1.414l1.465-1.354ZM3 9a1 1 0 0 1 1 1v.5a1 1 0 1 1-2 0V10a1 1 0 0 1 1-1ZM4.464 4.05 5.93 5.515A1 1 0 1 1 4.515 6.93L3.05 5.464A1 1 0 1 1 4.464 4.05ZM10 6.25A3.75 3.75 0 1 0 13.75 10 3.754 3.754 0 0 0 10 6.25Z" />
          </svg>
        ) : (
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path d="M15.77 12.23a5.75 5.75 0 0 1-8.12-8.12 1 1 0 0 0-1.28-1.28A7.75 7.75 0 1 0 17.05 13.5a1 1 0 0 0-1.28-1.27Z" />
          </svg>
        )}
      </span>
    </button>
  );
}
