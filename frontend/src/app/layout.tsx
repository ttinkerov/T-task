import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import { AppProviders } from '@/providers/app-providers';
import '@/styles/tailwind.css';
import '@/styles/globals.scss';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
});

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
  process.env.APP_URL?.replace(/\/$/, '') ||
  'http://localhost:3000';

const title = 'T-task — канбан и CRM для небольших команд';
const description =
  'Workspaces, доски, сделки, формы и whiteboard. Современный task tracker для малых команд.';

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#BE185D' },
    { media: '(prefers-color-scheme: dark)', color: '#E11D74' },
  ],
  colorScheme: 'light dark',
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: '%s · T-task',
  },
  description,
  applicationName: 'T-task',
  keywords: [
    'T-task',
    'kanban',
    'CRM',
    'task tracker',
    'project management',
    'workspaces',
    'доски',
    'задачи',
  ],
  authors: [{ name: 'ttinkerov' }],
  creator: 'ttinkerov',
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    url: '/',
    siteName: 'T-task',
    title,
    description,
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    shortcut: '/icon.svg',
    apple: [{ url: '/apple-icon', sizes: '180x180', type: 'image/png' }],
  },
  manifest: '/site.webmanifest',
  robots: {
    index: true,
    follow: true,
  },
  category: 'productivity',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" data-theme="light" className={inter.variable} suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <Script src="/theme-init.js" strategy="beforeInteractive" />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
