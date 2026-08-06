'use client';

import { useEffect } from 'react';
import { cn } from '@/shared/lib/cn';
import { applyLocale, useLocaleStore, type AppLocale } from '@/stores/locale.store';

const OPTIONS: Array<{ value: AppLocale; label: string }> = [
  { value: 'ru', label: 'RU' },
  { value: 'en', label: 'EN' },
];

export function LanguageToggle({ className }: { className?: string }) {
  const locale = useLocaleStore((state) => state.locale);
  const setLocale = useLocaleStore((state) => state.setLocale);

  useEffect(() => {
    applyLocale(locale);
  }, [locale]);

  return (
    <div
      className={cn('tt-lang-toggle', className)}
      role="group"
      aria-label={locale === 'ru' ? 'Язык' : 'Language'}
    >
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          className={cn('tt-lang-toggle__btn', locale === option.value && 'is-active')}
          aria-pressed={locale === option.value}
          onClick={() => setLocale(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
