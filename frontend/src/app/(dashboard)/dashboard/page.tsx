import { DashboardContent } from '@/features/auth/components/dashboard-content';
import { DashboardShell } from '@/features/auth/components/dashboard-shell';

export default function DashboardPage() {
  return (
    <DashboardShell>
      <DashboardContent />
    </DashboardShell>
  );
}
