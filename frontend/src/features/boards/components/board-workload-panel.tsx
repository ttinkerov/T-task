'use client';

import { useCallback, useMemo, useState } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import { formatMinutes, formatMinutesDelta } from '@/shared/lib/format-duration';
import BoardWorkloadPanelView from '@/vue/boards/BoardWorkloadPanel.vue';
import {
  buildWorkloadRows,
  filterTasksByDateRange,
  flattenBoardTasks,
  resolveWorkloadDateRange,
  sumWorkload,
  type WorkloadPeriod,
} from '../lib/workload';
import type { BoardView } from '../types';

interface BoardWorkloadPanelProps {
  board: BoardView;
}

export function BoardWorkloadPanel({ board }: BoardWorkloadPanelProps) {
  const [scope, setScope] = useState<Extract<WorkloadPeriod, 'today' | 'all'>>('today');

  const rows = useMemo(() => {
    const tasks = flattenBoardTasks(board);
    const range = resolveWorkloadDateRange(scope);
    return buildWorkloadRows(filterTasksByDateRange(tasks, range));
  }, [board, scope]);

  const totals = useMemo(() => sumWorkload(rows), [rows]);

  const formattedRows = useMemo(
    () =>
      rows.map((row) => {
        const hasDelta = row.planMinutes > 0 && row.actualMinutes > 0;
        const deltaClass = !hasDelta
          ? ''
          : row.actualMinutes > row.planMinutes
            ? 'board-workload__delta board-workload__delta--over'
            : row.actualMinutes < row.planMinutes
              ? 'board-workload__delta board-workload__delta--under'
              : 'board-workload__delta';
        return {
          id: row.id,
          name: row.name,
          taskCount: row.taskCount,
          planLabel: row.planMinutes > 0 ? formatMinutes(row.planMinutes) : '—',
          actualLabel: row.actualMinutes > 0 ? formatMinutes(row.actualMinutes) : '—',
          deltaLabel: hasDelta ? formatMinutesDelta(row.planMinutes, row.actualMinutes) : '—',
          deltaClass,
        };
      }),
    [rows],
  );

  const formattedTotals = useMemo(() => {
    const hasDelta = totals.planMinutes > 0 && totals.actualMinutes > 0;
    return {
      planLabel: totals.planMinutes > 0 ? formatMinutes(totals.planMinutes) : '—',
      actualLabel: totals.actualMinutes > 0 ? formatMinutes(totals.actualMinutes) : '—',
      deltaLabel: hasDelta ? formatMinutesDelta(totals.planMinutes, totals.actualMinutes) : '—',
      taskCount: totals.taskCount,
    };
  }, [totals]);

  const hint =
    rows.length === 0
      ? 'Укажите оценку и факт в задачах — здесь появится сводка по команде.'
      : scope === 'today'
        ? 'Сумма оценок и факта по задачам с дедлайном на сегодня.'
        : 'Сумма оценок и факта по всем задачам на доске.';

  const onScopeChange = useCallback((next: 'today' | 'all') => {
    setScope(next);
  }, []);

  const viewProps = useMemo(
    () => ({
      scope,
      hint,
      rows: formattedRows,
      totals: formattedTotals,
      onScopeChange,
    }),
    [scope, hint, formattedRows, formattedTotals, onScopeChange],
  );

  return <VueIsland component={BoardWorkloadPanelView} componentProps={viewProps} />;
}
