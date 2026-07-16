'use client';

import { DashboardShell } from '@/features/auth/components/dashboard-shell';
import { PomodoroTimer } from '@/components/pomodoro/pomodoro-timer';
import { MeditationTimer } from '@/features/meditation/components/meditation-timer';
import { useWorkspacesQuery } from '@/features/workspaces/hooks';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function FocusPage() {
  const router = useRouter();
  const { data: workspaces = [], isLoading } = useWorkspacesQuery();
  const [activeTool, setActiveTool] = useState<'pomodoro' | 'meditation'>('pomodoro');

  useEffect(() => {
    if (!isLoading && workspaces.length === 0) {
      router.replace('/onboarding');
    }
  }, [isLoading, router, workspaces.length]);

  return (
    <DashboardShell>
      <div className="focus-tools">
        <div className="focus-tools__tabs" role="tablist" aria-label="Инструменты фокуса">
          <button
            type="button"
            role="tab"
            id="focus-tab-pomodoro"
            aria-selected={activeTool === 'pomodoro'}
            aria-controls="focus-panel-pomodoro"
            className={activeTool === 'pomodoro' ? 'focus-tools__tab--active' : undefined}
            onClick={() => setActiveTool('pomodoro')}
          >
            Pomodoro
          </button>
          <button
            type="button"
            role="tab"
            id="focus-tab-meditation"
            aria-selected={activeTool === 'meditation'}
            aria-controls="focus-panel-meditation"
            className={activeTool === 'meditation' ? 'focus-tools__tab--active' : undefined}
            onClick={() => setActiveTool('meditation')}
          >
            Медитации
          </button>
        </div>

        <div
          role="tabpanel"
          id={`focus-panel-${activeTool}`}
          aria-labelledby={`focus-tab-${activeTool}`}
          tabIndex={0}
        >
          {activeTool === 'pomodoro' ? <PomodoroTimer /> : <MeditationTimer />}
        </div>
      </div>
    </DashboardShell>
  );
}
