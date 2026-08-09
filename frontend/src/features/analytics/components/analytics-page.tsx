'use client';

import { useCallback, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { VueIsland } from '@/components/vue/VueIsland';
import { fetchAnalyticsSummary, fetchAnalyticsWorkload } from '@/features/workspace-tools/api';
import {
  buildWorkloadRows,
  filterTasksByAssignee,
  filterTasksByDateRange,
  getPeriodLabel,
  resolveWorkloadDateRange,
  sumWorkload,
  type WorkloadPeriod,
  type WorkloadTask,
} from '@/features/boards/lib/workload';
import { useMembersQuery } from '@/features/workspaces/hooks';
import { formatMinutes, formatMinutesDelta } from '@/shared/lib/format-duration';
import AnalyticsPageView from '@/vue/analytics/AnalyticsPageView.vue';
import { StuckTasksCard } from './stuck-tasks-card';

interface AnalyticsPageProps {
  workspaceId: string;
}

type WorkloadRowView = {
  id: string;
  name: string;
  plan: string;
  actual: string;
  delta: string;
  deltaTone: 'over' | 'under' | '';
  taskCount: number;
  efficiency: string;
};

export function AnalyticsPage({ workspaceId }: AnalyticsPageProps) {
  const { data: members = [] } = useMembersQuery(workspaceId);

  const [period, setPeriod] = useState<WorkloadPeriod>('week');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState<string | ''>('');
  const [drilldownId, setDrilldownId] = useState<string | null>(null);
  const [stuckHost, setStuckHost] = useState<HTMLElement | null>(null);

  const dateRange = useMemo(
    () => resolveWorkloadDateRange(period, customFrom, customTo),
    [period, customFrom, customTo],
  );

  const summaryQuery = useQuery({
    queryKey: [
      'analytics-summary',
      workspaceId,
      dateRange.from?.toISOString(),
      dateRange.to?.toISOString(),
    ],
    queryFn: async () => {
      const response = await fetchAnalyticsSummary(
        workspaceId,
        dateRange.from?.toISOString(),
        dateRange.to?.toISOString(),
      );
      return response.data;
    },
    staleTime: 60_000,
  });

  const workloadQuery = useQuery({
    queryKey: ['analytics-workload', workspaceId],
    queryFn: async () => {
      const response = await fetchAnalyticsWorkload(workspaceId);
      return response.data;
    },
    staleTime: 5 * 60_000,
  });

  const scopedTasks = useMemo(() => {
    const tasks = (workloadQuery.data?.tasks ?? []) as WorkloadTask[];
    return filterTasksByAssignee(filterTasksByDateRange(tasks, dateRange), assigneeFilter);
  }, [assigneeFilter, dateRange, workloadQuery.data?.tasks]);

  const rows = useMemo(() => buildWorkloadRows(scopedTasks), [scopedTasks]);
  const totals = useMemo(() => sumWorkload(rows), [rows]);

  const drilldownRow = useMemo(() => {
    if (!drilldownId) return null;
    return rows.find((row) => row.id === drilldownId) ?? null;
  }, [drilldownId, rows]);

  const drilldownTasks = useMemo(() => {
    if (!drilldownId) return [];
    return scopedTasks.filter((task) => (task.assigneeId ?? 'unassigned') === drilldownId);
  }, [drilldownId, scopedTasks]);

  const periodLabel = getPeriodLabel(period, customFrom, customTo);

  const summaryCards = useMemo(
    () => [
      {
        label: 'Пропускная способность',
        value: summaryQuery.isLoading ? '…' : String(summaryQuery.data?.throughput ?? '—'),
      },
      {
        label: 'Средний цикл (ч)',
        value: summaryQuery.isLoading ? '…' : String(summaryQuery.data?.avgCycleTimeHours ?? '—'),
      },
      {
        label: 'Просрочено',
        value: summaryQuery.isLoading ? '…' : String(summaryQuery.data?.overdueCount ?? '—'),
      },
    ],
    [summaryQuery.data, summaryQuery.isLoading],
  );

  const summaryError = summaryQuery.isError
    ? summaryQuery.error instanceof Error
      ? summaryQuery.error.message
      : 'Не удалось загрузить сводку'
    : '';
  const workloadError = workloadQuery.isError
    ? workloadQuery.error instanceof Error
      ? workloadQuery.error.message
      : 'Не удалось загрузить нагрузку'
    : '';

  const rowViews = useMemo<WorkloadRowView[]>(
    () =>
      rows.map((row) => {
        const hasDelta = row.planMinutes > 0 && row.actualMinutes > 0;
        let deltaTone: WorkloadRowView['deltaTone'] = '';
        if (hasDelta && row.actualMinutes > row.planMinutes) deltaTone = 'over';
        if (hasDelta && row.actualMinutes < row.planMinutes) deltaTone = 'under';

        return {
          id: row.id,
          name: row.name,
          plan: row.planMinutes > 0 ? formatMinutes(row.planMinutes) : '—',
          actual: row.actualMinutes > 0 ? formatMinutes(row.actualMinutes) : '—',
          delta: hasDelta ? formatMinutesDelta(row.planMinutes, row.actualMinutes) : '—',
          deltaTone,
          taskCount: row.taskCount,
          efficiency: formatEfficiency(row.planMinutes, row.actualMinutes),
        };
      }),
    [rows],
  );

  const totalsView = useMemo(
    () => ({
      plan: totals.planMinutes > 0 ? formatMinutes(totals.planMinutes) : '—',
      actual: totals.actualMinutes > 0 ? formatMinutes(totals.actualMinutes) : '—',
      delta:
        totals.planMinutes > 0 && totals.actualMinutes > 0
          ? formatMinutesDelta(totals.planMinutes, totals.actualMinutes)
          : '—',
      taskCount: totals.taskCount,
      efficiency: formatEfficiency(totals.planMinutes, totals.actualMinutes),
    }),
    [totals],
  );

  const drilldownView = useMemo(() => {
    if (!drilldownRow) return null;

    return {
      name: drilldownRow.name,
      hint: `Задачи ${periodLabel}: план ${formatMinutes(drilldownRow.planMinutes)}, факт ${formatMinutes(drilldownRow.actualMinutes)}`,
      tasks: drilldownTasks.map((task) => ({
        id: task.id,
        title: task.title,
        columnName: task.columnName,
        plan: task.timeEstimateMinutes ? formatMinutes(task.timeEstimateMinutes) : '—',
        actual: task.actualMinutes ? formatMinutes(task.actualMinutes) : '—',
        due: task.dueDate
          ? new Date(task.dueDate).toLocaleDateString('ru-RU', {
              day: 'numeric',
              month: 'short',
            })
          : '—',
      })),
    };
  }, [drilldownRow, drilldownTasks, periodLabel]);

  const onPeriodChange = useCallback((value: string) => {
    setPeriod(value as WorkloadPeriod);
    setDrilldownId(null);
  }, []);

  const onCustomFromChange = useCallback((value: string) => {
    setCustomFrom(value);
  }, []);

  const onCustomToChange = useCallback((value: string) => {
    setCustomTo(value);
  }, []);

  const onAssigneeChange = useCallback((value: string) => {
    setAssigneeFilter(value);
    setDrilldownId(value || null);
  }, []);

  const onToggleDrilldown = useCallback((rowId: string) => {
    setDrilldownId((current) => (current === rowId ? null : rowId));
  }, []);

  const onCloseDrilldown = useCallback(() => {
    setDrilldownId(null);
  }, []);

  const onStuckHostReady = useCallback((el: HTMLElement | null) => {
    setStuckHost(el);
  }, []);

  const onRetrySummary = useCallback(() => {
    void summaryQuery.refetch();
  }, [summaryQuery]);

  const onRetryWorkload = useCallback(() => {
    void workloadQuery.refetch();
  }, [workloadQuery]);

  const viewProps = useMemo(
    () => ({
      summaryCards,
      summaryError,
      workloadError,
      workloadTruncated: Boolean(workloadQuery.data?.truncated),
      workloadLoading: workloadQuery.isLoading,
      period,
      customFrom,
      customTo,
      assigneeFilter,
      members,
      periodLabel,
      rows: rowViews,
      totals: totalsView,
      drilldownId,
      drilldown: drilldownView,
      onPeriodChange,
      onCustomFromChange,
      onCustomToChange,
      onAssigneeChange,
      onToggleDrilldown,
      onCloseDrilldown,
      onStuckHostReady,
      onRetrySummary,
      onRetryWorkload,
    }),
    [
      summaryCards,
      summaryError,
      workloadError,
      workloadQuery.data?.truncated,
      workloadQuery.isLoading,
      period,
      customFrom,
      customTo,
      assigneeFilter,
      members,
      periodLabel,
      rowViews,
      totalsView,
      drilldownId,
      drilldownView,
      onPeriodChange,
      onCustomFromChange,
      onCustomToChange,
      onAssigneeChange,
      onToggleDrilldown,
      onCloseDrilldown,
      onStuckHostReady,
      onRetrySummary,
      onRetryWorkload,
    ],
  );

  return (
    <>
      <VueIsland component={AnalyticsPageView} componentProps={viewProps} />
      {stuckHost
        ? createPortal(
            <StuckTasksCard workspaceId={workspaceId} assigneeId={assigneeFilter || undefined} />,
            stuckHost,
          )
        : null}
    </>
  );
}

function formatEfficiency(planMinutes: number, actualMinutes: number) {
  if (planMinutes <= 0 || actualMinutes <= 0) {
    return '—';
  }

  const ratio = Math.round((planMinutes / actualMinutes) * 100);
  return `${ratio}%`;
}
