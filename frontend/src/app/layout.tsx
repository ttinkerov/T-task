import type { Metadata } from 'next';
import Script from 'next/script';
import { AppProviders } from '@/providers/app-providers';
import '@/styles/tailwind.css';
import '@/styles/globals.scss';

export const metadata: Metadata = {
  title: 'T-task — управление проектами для команд',
  description: 'Современный task tracker с Kanban, workspaces и realtime для малых команд',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" data-theme="light" suppressHydrationWarning>
      <body className="antialiased">
        <Script src="/theme-init.js" strategy="beforeInteractive" />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
