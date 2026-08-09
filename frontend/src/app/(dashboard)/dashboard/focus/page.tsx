'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { VueIsland } from '@/components/vue/VueIsland';
import { PomodoroTimer } from '@/components/pomodoro/pomodoro-timer';
import { MeditationTimer } from '@/features/meditation/components/meditation-timer';
import { useWorkspacesQuery } from '@/features/workspaces/hooks';
import FocusToolsTabsView from '@/vue/focus/FocusToolsTabs.vue';

type FocusTool = 'pomodoro' | 'meditation';

export default function FocusPage() {
  const router = useRouter();
  const { data: workspaces = [], isLoading, isError, refetch } = useWorkspacesQuery();
  const [activeTool, setActiveTool] = useState<FocusTool>('pomodoro');

  useEffect(() => {
    if (!isLoading && !isError && workspaces.length === 0) {
      router.replace('/onboarding');
    }
  }, [isLoading, isError, router, workspaces.length]);

  const onSelect = useCallback((tool: FocusTool) => {
    setActiveTool(tool);
  }, []);

  const tabsProps = useMemo(
    () => ({
      activeTool,
      onSelect,
    }),
    [activeTool, onSelect],
  );

  return (
    <div className="focus-tools">
      {isError ? (
        <div className="text-sm" role="alert" style={{ marginBottom: '0.75rem' }}>
          <p className="text-red-400">
            Не удалось загрузить команды. Инструменты фокуса доступны офлайн.
          </p>
          <button type="button" className="board-filters__chip" onClick={() => void refetch()}>
            Повторить
          </button>
        </div>
      ) : null}

      <VueIsland component={FocusToolsTabsView} componentProps={tabsProps} />

      <div
        role="tabpanel"
        id={`focus-panel-${activeTool}`}
        aria-labelledby={`focus-tab-${activeTool}`}
        tabIndex={0}
      >
        {activeTool === 'pomodoro' ? <PomodoroTimer /> : <MeditationTimer />}
      </div>
    </div>
  );
}
