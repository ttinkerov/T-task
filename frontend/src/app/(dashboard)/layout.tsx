'use client';

import { DashboardShell } from '@/features/auth/components/dashboard-shell';
import { usePathname } from 'next/navigation';

const BOARD_MODE_PATHS = [
  '/dashboard/board',
  '/dashboard/all-tasks',
  '/dashboard/my-tasks',
  '/dashboard/roadmap',
  '/dashboard/epic-board',
  '/dashboard/whiteboard',
  '/dashboard/crm',
] as const;

function isBoardModePath(pathname: string): boolean {
  return BOARD_MODE_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export default function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return <DashboardShell boardMode={isBoardModePath(pathname)}>{children}</DashboardShell>;
}
