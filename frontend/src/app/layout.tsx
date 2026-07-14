import type { Metadata } from 'next';
import { AppProviders } from '@/providers/app-providers';
import '@/styles/tailwind.css';
import '@/styles/globals.scss';

const themeInitScript = `
try {
  var stored = localStorage.getItem('ttask-theme');
  if (stored) {
    var parsed = JSON.parse(stored);
    var theme = parsed && parsed.state && parsed.state.theme;
    if (theme === 'light' || theme === 'dark') {
      document.documentElement.dataset.theme = theme;
    }
  }
} catch (_) {}
`;

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
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
