import type { Metadata } from 'next';
import { Inter, Unbounded } from 'next/font/google';
import { AppProviders } from '@/providers/app-providers';
import '@/styles/tailwind.css';
import '@/styles/globals.scss';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
});

const unbounded = Unbounded({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
});

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
    <html lang="ru">
      <body className={`${inter.variable} ${unbounded.variable} antialiased`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
