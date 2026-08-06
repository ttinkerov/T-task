'use client';

import { useCallback, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { VueIsland } from '@/components/vue/VueIsland';
import { AiSummaryPanel } from '@/features/ai/components/ai-summary-panel';
import {
  useCloseSprintMutation,
  useCreateSprintMutation,
  useSprintBurndownQuery,
  useSprintVelocityQuery,
  useSprintsQuery,
} from '@/features/sprints';
import BoardSprintPanelView from '@/vue/boards/BoardSprintPanel.vue';

export function BoardSprintPanel({ workspaceId }: { workspaceId: string }) {
  const { data: sprints = [] } = useSprintsQuery(workspaceId);
  const { data: velocity } = useSprintVelocityQuery(workspaceId);
  const createMutation = useCreateSprintMutation(workspaceId);
  const closeMutation = useCloseSprintMutation(workspaceId);
  const active =
    sprints.find((sprint) => sprint.active) ?? sprints.find((s) => !s.closedAt) ?? null;
  const { data: burndown } = useSprintBurndownQuery(workspaceId, active?.id ?? null);
  const [aiHost, setAiHost] = useState<HTMLElement | null>(null);

  const activePoints = useMemo(() => {
    if (!active || !velocity) return null;
    return velocity.sprints.find((item) => item.sprintId === active.id) ?? null;
  }, [active, velocity]);

  const burndownChart = useMemo(() => {
    if (!burndown?.days.length) return null;
    const maxRemaining = Math.max(
      1,
      ...burndown.days.map((day) => Math.max(day.remaining, day.ideal)),
    );
    const last = burndown.days.at(-1);
    const pointsMeta =
      typeof burndown.totalPoints === 'number'
        ? ` · ${last?.remainingPoints ?? 0}/${burndown.totalPoints} SP`
        : '';
    return {
      viewBox: `0 0 ${burndown.days.length * 24} 80`,
      idealPoints: burndown.days
        .map((day, index) => `${index * 24 + 8},${76 - (day.ideal / maxRemaining) * 64}`)
        .join(' '),
      remainingPoints: burndown.days
        .map((day, index) => `${index * 24 + 8},${76 - (day.remaining / maxRemaining) * 64}`)
        .join(' '),
      meta: `Осталось ${last?.remaining ?? 0} из ${burndown.total}${pointsMeta}`,
    };
  }, [burndown]);

  const velocityBars = useMemo(() => {
    if (!velocity?.sprints.length) return [];
    const velocityMax = Math.max(
      1,
      velocity.averageVelocity,
      ...velocity.sprints.map((item) => Math.max(item.completedPoints, item.committedPoints)),
    );
    return velocity.sprints.map((item) => ({
      sprintId: item.sprintId,
      name: item.name,
      completedPoints: item.completedPoints,
      committedHeight: `${Math.max(4, (item.committedPoints / velocityMax) * 100)}%`,
      completedHeight: `${Math.max(4, (item.completedPoints / velocityMax) * 100)}%`,
    }));
  }, [velocity]);

  const onCreate = useCallback(
    async (payload: { name: string; startDate: string; endDate: string }) => {
      await createMutation.mutateAsync({
        name: payload.name,
        startDate: new Date(`${payload.startDate}T00:00:00`).toISOString(),
        endDate: new Date(`${payload.endDate}T23:59:59`).toISOString(),
      });
    },
    [createMutation],
  );

  const onClose = useCallback(async () => {
    if (!active) return;
    await closeMutation.mutateAsync(active.id);
  }, [active, closeMutation]);

  const onAiHost = useCallback((el: HTMLElement | null) => {
    setAiHost(el);
  }, []);

  const viewProps = useMemo(
    () => ({
      active,
      activePoints,
      burndownChart,
      velocityBars,
      averageVelocity: velocity?.averageVelocity ?? 0,
      createPending: createMutation.isPending,
      closePending: closeMutation.isPending,
      onCreate,
      onClose,
      onAiHost,
    }),
    [
      active,
      activePoints,
      burndownChart,
      velocityBars,
      velocity?.averageVelocity,
      createMutation.isPending,
      closeMutation.isPending,
      onCreate,
      onClose,
      onAiHost,
    ],
  );

  return (
    <>
      <VueIsland component={BoardSprintPanelView} componentProps={viewProps} />
      {aiHost && active
        ? createPortal(
            <AiSummaryPanel
              key={active.id}
              workspaceId={workspaceId}
              scope="sprint"
              sprintId={active.id}
              compact
            />,
            aiHost,
          )
        : null}
    </>
  );
}
