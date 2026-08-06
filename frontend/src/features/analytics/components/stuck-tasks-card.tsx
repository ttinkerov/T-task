'use client';

import { useCallback, useMemo, useState } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import { useAiSettingsQuery } from '@/features/ai';
import StuckTasksCardView from '@/vue/analytics/StuckTasksCard.vue';
import { useStuckTasksInsightMutation, useStuckTasksQuery } from '../hooks';

const DAY_OPTIONS = [3, 5, 7, 14];

export function StuckTasksCard({
  workspaceId,
  assigneeId,
}: {
  workspaceId: string;
  assigneeId?: string;
}) {
  const [days, setDays] = useState(5);
  const params = { days, assigneeId: assigneeId || undefined };
  const stuckQuery = useStuckTasksQuery(workspaceId, params);
  const { data: aiSettings } = useAiSettingsQuery(workspaceId);
  const insightMutation = useStuckTasksInsightMutation(workspaceId);
  const [insight, setInsight] = useState<string | null>(null);
  const [insightError, setInsightError] = useState<string | null>(null);

  const data = stuckQuery.data;
  const tasks = useMemo(
    () =>
      (data?.tasks ?? []).map((task) => ({
        id: task.id,
        title: task.title,
        columnName: task.columnName,
        assigneeName: task.assignee?.name ?? '—',
        daysSinceUpdate: task.daysSinceUpdate,
      })),
    [data?.tasks],
  );

  const onDaysChange = useCallback((value: number) => {
    setDays(value);
    setInsight(null);
    setInsightError(null);
  }, []);

  const onRequestInsight = useCallback(async () => {
    setInsightError(null);
    try {
      const result = await insightMutation.mutateAsync(params);
      setInsight(result.insight);
    } catch (err) {
      setInsightError(err instanceof Error ? err.message : 'Не удалось получить разбор');
    }
  }, [insightMutation, params]);

  const cardProps = useMemo(
    () => ({
      days,
      dayOptions: DAY_OPTIONS,
      aiConfigured: Boolean(aiSettings?.configured),
      isLoading: stuckQuery.isLoading,
      isError: stuckQuery.isError,
      insightPending: insightMutation.isPending,
      count: data?.count ?? 0,
      truncated: Boolean(data?.truncated),
      tasks,
      insight,
      insightError,
      onDaysChange,
      onRequestInsight,
    }),
    [
      days,
      aiSettings?.configured,
      stuckQuery.isLoading,
      stuckQuery.isError,
      insightMutation.isPending,
      data?.count,
      data?.truncated,
      tasks,
      insight,
      insightError,
      onDaysChange,
      onRequestInsight,
    ],
  );

  return <VueIsland component={StuckTasksCardView} componentProps={cardProps} />;
}
