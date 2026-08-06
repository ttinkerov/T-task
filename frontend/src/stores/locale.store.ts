import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AppLocale = 'ru' | 'en';

interface LocaleState {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  toggleLocale: () => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set, get) => ({
      locale: 'ru',
      setLocale: (locale) => {
        applyLocale(locale);
        set({ locale });
      },
      toggleLocale: () => {
        const next = get().locale === 'ru' ? 'en' : 'ru';
        applyLocale(next);
        set({ locale: next });
      },
    }),
    { name: 'ttask-locale' },
  ),
);

export function applyLocale(locale: AppLocale): void {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = locale;
}
