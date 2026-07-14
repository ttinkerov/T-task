'use client';

import { useMemo, useState } from 'react';
import { formatMinutes, formatMinutesDelta } from '@/shared/lib/format-duration';
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

  return (
    <div className="board-workload">
      <div className="board-workload__head">
        <div>
          <h3 className="board-workload__title">Загрузка по времени</h3>
          <p className="board-workload__hint">
            {rows.length === 0
              ? 'Укажите оценку и факт в задачах — здесь появится сводка по команде.'
              : scope === 'today'
                ? 'Сумма оценок и факта по задачам с дедлайном на сегодня.'
                : 'Сумма оценок и факта по всем задачам на доске.'}
          </p>
        </div>
        <WorkloadScopeToggle scope={scope} onChange={setScope} />
      </div>

      {rows.length > 0 ? (
        <div className="board-workload__table-wrap">
          <table className="board-workload__table">
            <thead>
              <tr>
                <th>Сотрудник</th>
                <th>План</th>
                <th>Факт</th>
                <th>Δ</th>
                <th>Задач</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td>{row.planMinutes > 0 ? formatMinutes(row.planMinutes) : '—'}</td>
                  <td>{row.actualMinutes > 0 ? formatMinutes(row.actualMinutes) : '—'}</td>
                  <td>
                    {row.planMinutes > 0 && row.actualMinutes > 0 ? (
                      <span
                        className={
                          row.actualMinutes > row.planMinutes
                            ? 'board-workload__delta board-workload__delta--over'
                            : row.actualMinutes < row.planMinutes
                              ? 'board-workload__delta board-workload__delta--under'
                              : 'board-workload__delta'
                        }
                      >
                        {formatMinutesDelta(row.planMinutes, row.actualMinutes)}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>{row.taskCount}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td>Итого по проекту</td>
                <td>{totals.planMinutes > 0 ? formatMinutes(totals.planMinutes) : '—'}</td>
                <td>{totals.actualMinutes > 0 ? formatMinutes(totals.actualMinutes) : '—'}</td>
                <td>
                  {totals.planMinutes > 0 && totals.actualMinutes > 0
                    ? formatMinutesDelta(totals.planMinutes, totals.actualMinutes)
                    : '—'}
                </td>
                <td>{totals.taskCount}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : null}
    </div>
  );
}

function WorkloadScopeToggle({
  scope,
  onChange,
}: {
  scope: 'today' | 'all';
  onChange: (scope: 'today' | 'all') => void;
}) {
  return (
    <div className="board-workload__toggle" role="tablist" aria-label="Период загрузки">
      <button
        type="button"
        role="tab"
        aria-selected={scope === 'today'}
        className={
          scope === 'today'
            ? 'board-workload__toggle-btn board-workload__toggle-btn--active'
            : 'board-workload__toggle-btn'
        }
        onClick={() => onChange('today')}
      >
        На сегодня
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={scope === 'all'}
        className={
          scope === 'all'
            ? 'board-workload__toggle-btn board-workload__toggle-btn--active'
            : 'board-workload__toggle-btn'
        }
        onClick={() => onChange('all')}
      >
        Весь проект
      </button>
    </div>
  );
}
