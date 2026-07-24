'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchAnalyticsSummary, fetchAnalyticsWorkload } from '@/features/workspace-tools/api';
import {
  buildWorkloadRows,
  filterTasksByAssignee,
  filterTasksByDateRange,
  getPeriodLabel,
  resolveWorkloadDateRange,
  sumWorkload,
  type WorkloadPeriod,
  type WorkloadRow,
  type WorkloadTask,
} from '@/features/boards/lib/workload';
import { useMembersQuery } from '@/features/workspaces/hooks';
import { formatMinutes, formatMinutesDelta } from '@/shared/lib/format-duration';
import { StuckTasksCard } from './stuck-tasks-card';

interface AnalyticsPageProps {
  workspaceId: string;
}

export function AnalyticsPage({ workspaceId }: AnalyticsPageProps) {
  const { data: members = [] } = useMembersQuery(workspaceId);

  const [period, setPeriod] = useState<WorkloadPeriod>('week');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState<string | ''>('');
  const [drilldownId, setDrilldownId] = useState<string | null>(null);

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
  const workloadLoading = workloadQuery.isLoading;

  return (
    <div className="analytics-page">
      <header className="analytics-page__header">
        <div>
          <h1 className="analytics-page__title">Аналитика</h1>
          <p className="analytics-page__subtitle">
            Контролируйте прогресс каждого участника: выберите период и сотрудника, чтобы увидеть
            план, факт и список задач.
          </p>
        </div>
      </header>

      {workloadQuery.data?.truncated ? (
        <p className="text-sm text-muted-foreground" role="status">
          Показаны первые 5000 задач доски для расчёта нагрузки.
        </p>
      ) : null}

      <div
        className="analytics-summary-cards"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(10rem,1fr))',
          gap: '0.75rem',
          marginBottom: '1.25rem',
        }}
      >
        <article className="glass-card" style={{ padding: '0.9rem' }}>
          <p className="text-sm text-muted-foreground">Throughput</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>
            {summaryQuery.isLoading ? '…' : (summaryQuery.data?.throughput ?? '—')}
          </p>
        </article>
        <article className="glass-card" style={{ padding: '0.9rem' }}>
          <p className="text-sm text-muted-foreground">Avg cycle (ч)</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>
            {summaryQuery.isLoading ? '…' : (summaryQuery.data?.avgCycleTimeHours ?? '—')}
          </p>
        </article>
        <article className="glass-card" style={{ padding: '0.9rem' }}>
          <p className="text-sm text-muted-foreground">Overdue</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>
            {summaryQuery.isLoading ? '…' : (summaryQuery.data?.overdueCount ?? '—')}
          </p>
        </article>
      </div>

      <StuckTasksCard workspaceId={workspaceId} assigneeId={assigneeFilter || undefined} />

      {workloadLoading ? (
        <p className="text-sm text-muted-foreground">Загрузка нагрузки по доске...</p>
      ) : null}
      <div className="analytics-filters">
        <div className="analytics-filters__group">
          <span className="analytics-filters__label">Период</span>
          <div className="analytics-filters__periods" role="tablist" aria-label="Период аналитики">
            <PeriodButton
              active={period === 'today'}
              onClick={() => {
                setPeriod('today');
                setDrilldownId(null);
              }}
            >
              День
            </PeriodButton>
            <PeriodButton
              active={period === 'week'}
              onClick={() => {
                setPeriod('week');
                setDrilldownId(null);
              }}
            >
              Неделя
            </PeriodButton>
            <PeriodButton
              active={period === 'month'}
              onClick={() => {
                setPeriod('month');
                setDrilldownId(null);
              }}
            >
              Месяц
            </PeriodButton>
            <PeriodButton
              active={period === 'all'}
              onClick={() => {
                setPeriod('all');
                setDrilldownId(null);
              }}
            >
              Проект
            </PeriodButton>
            <PeriodButton
              active={period === 'custom'}
              onClick={() => {
                setPeriod('custom');
                setDrilldownId(null);
              }}
            >
              Свой
            </PeriodButton>
          </div>
        </div>

        {period === 'custom' ? (
          <div className="analytics-filters__dates">
            <label className="analytics-filters__date-field">
              <span>С</span>
              <input
                type="date"
                value={customFrom}
                onChange={(event) => setCustomFrom(event.target.value)}
                className="glass-input"
              />
            </label>
            <label className="analytics-filters__date-field">
              <span>По</span>
              <input
                type="date"
                value={customTo}
                onChange={(event) => setCustomTo(event.target.value)}
                className="glass-input"
              />
            </label>
          </div>
        ) : null}

        <label className="analytics-filters__member">
          <span className="analytics-filters__label">Сотрудник</span>
          <select
            value={assigneeFilter}
            onChange={(event) => {
              setAssigneeFilter(event.target.value);
              setDrilldownId(event.target.value || null);
            }}
            className="glass-input"
          >
            <option value="">Вся команда</option>
            {members.map((member) => (
              <option key={member.userId} value={member.userId}>
                {member.user.name}
              </option>
            ))}
            <option value="unassigned">Без исполнителя</option>
          </select>
        </label>
      </div>

      <section className="analytics-summary">
        <div className="analytics-summary__head">
          <h2 className="analytics-summary__title">Продуктивность команды</h2>
          <p className="analytics-summary__hint">
            Показатели {periodLabel}. Нажмите на сотрудника, чтобы увидеть его задачи.
          </p>
        </div>

        {rows.length === 0 ? (
          <p className="analytics-summary__empty">
            Нет задач с оценкой времени за выбранный период. Укажите план и факт в карточках на
            доске.
          </p>
        ) : (
          <div className="board-workload__table-wrap">
            <table className="board-workload__table analytics-table">
              <thead>
                <tr>
                  <th>Сотрудник</th>
                  <th>План</th>
                  <th>Факт</th>
                  <th>Δ</th>
                  <th>Задач</th>
                  <th>Эффективность</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <AnalyticsRow
                    key={row.id}
                    row={row}
                    active={drilldownId === row.id}
                    onSelect={() =>
                      setDrilldownId((current) => (current === row.id ? null : row.id))
                    }
                  />
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td>Итого</td>
                  <td>{totals.planMinutes > 0 ? formatMinutes(totals.planMinutes) : '—'}</td>
                  <td>{totals.actualMinutes > 0 ? formatMinutes(totals.actualMinutes) : '—'}</td>
                  <td>
                    {totals.planMinutes > 0 && totals.actualMinutes > 0
                      ? formatMinutesDelta(totals.planMinutes, totals.actualMinutes)
                      : '—'}
                  </td>
                  <td>{totals.taskCount}</td>
                  <td>{formatEfficiency(totals.planMinutes, totals.actualMinutes)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      {drilldownRow ? (
        <AnalyticsDrilldown
          row={drilldownRow}
          tasks={drilldownTasks}
          periodLabel={periodLabel}
          onClose={() => setDrilldownId(null)}
        />
      ) : null}
    </div>
  );
}

function PeriodButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      className={
        active
          ? 'board-workload__toggle-btn board-workload__toggle-btn--active'
          : 'board-workload__toggle-btn'
      }
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function AnalyticsRow({
  row,
  active,
  onSelect,
}: {
  row: WorkloadRow;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <tr
      className={
        active ? 'analytics-table__row analytics-table__row--active' : 'analytics-table__row'
      }
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect();
        }
      }}
      tabIndex={0}
      role="button"
      aria-pressed={active}
    >
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
      <td>{formatEfficiency(row.planMinutes, row.actualMinutes)}</td>
    </tr>
  );
}

function AnalyticsDrilldown({
  row,
  tasks,
  periodLabel,
  onClose,
}: {
  row: WorkloadRow;
  tasks: WorkloadTask[];
  periodLabel: string;
  onClose: () => void;
}) {
  return (
    <section className="analytics-drilldown">
      <div className="analytics-drilldown__head">
        <div>
          <h3 className="analytics-drilldown__title">{row.name}</h3>
          <p className="analytics-drilldown__hint">
            Задачи {periodLabel}: план {formatMinutes(row.planMinutes)}, факт{' '}
            {formatMinutes(row.actualMinutes)}
          </p>
        </div>
        <button type="button" className="btn-ghost" onClick={onClose}>
          Свернуть
        </button>
      </div>

      {tasks.length === 0 ? (
        <p className="analytics-drilldown__empty">Нет задач за выбранный период.</p>
      ) : (
        <div className="board-workload__table-wrap">
          <table className="board-workload__table">
            <thead>
              <tr>
                <th>Задача</th>
                <th>Колонка</th>
                <th>План</th>
                <th>Факт</th>
                <th>Дедлайн</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id}>
                  <td className="analytics-drilldown__task-title">{task.title}</td>
                  <td>{task.columnName}</td>
                  <td>
                    {task.timeEstimateMinutes ? formatMinutes(task.timeEstimateMinutes) : '—'}
                  </td>
                  <td>{task.actualMinutes ? formatMinutes(task.actualMinutes) : '—'}</td>
                  <td>
                    {task.dueDate
                      ? new Date(task.dueDate).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'short',
                        })
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function formatEfficiency(planMinutes: number, actualMinutes: number) {
  if (planMinutes <= 0 || actualMinutes <= 0) {
    return '—';
  }

  const ratio = Math.round((planMinutes / actualMinutes) * 100);
  return `${ratio}%`;
}
