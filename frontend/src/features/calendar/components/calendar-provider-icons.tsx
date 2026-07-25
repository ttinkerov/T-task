import type { ReactNode } from 'react';

function ProviderIcon({ src }: { src: string }) {
  return <img className="calendar-provider__glyph" src={src} alt="" />;
}

export const CALENDAR_PROVIDER_ICONS: Record<string, ReactNode> = {
  google: <ProviderIcon src="/icons/calendar/google-calendar.svg" />,
  yandex: <ProviderIcon src="/icons/calendar/yandex.svg" />,
  apple: <ProviderIcon src="/icons/calendar/apple-calendar.svg" />,
  caldav: <ProviderIcon src="/icons/calendar/generic-calendar.svg" />,
};
