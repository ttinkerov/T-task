'use client';

import { useState } from 'react';
import { useAiSettingsQuery } from '@/features/ai';
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
  const tasks = data?.tasks ?? [];

  const handleInsight = async () => {
    setInsightError(null);
    try {
      const result = await insightMutation.mutateAsync(params);
      setInsight(result.insight);
    } catch (err) {
      setInsightError(err instanceof Error ? err.message : 'Не удалось получить разбор');
    }
  };

  return (
    <section className="stuck-tasks-card">
      <header className="stuck-tasks-card__head">
        <div>
          <p className="stuck-tasks-card__eyebrow">Здоровье доски</p>
          <h2>Застрявшие задачи</h2>
          <p className="stuck-tasks-card__hint">
            Открытые задачи без обновлений дольше порога (прокси «без движения»).
          </p>
        </div>
        <div className="stuck-tasks-card__controls">
          <label>
            Порог
            <select
              className="glass-input"
              value={days}
              onChange={(event) => {
                setDays(Number(event.target.value));
                setInsight(null);
                setInsightError(null);
              }}
            >
              {DAY_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {value} дн.
                </option>
              ))}
            </select>
          </label>
          {aiSettings?.configured ? (
            <button
              type="button"
              className="btn-ghost"
              disabled={insightMutation.isPending || stuckQuery.isLoading}
              onClick={() => void handleInsight()}
            >
              {insightMutation.isPending ? 'ИИ думает…' : 'Разбор ИИ'}
            </button>
          ) : null}
        </div>
      </header>

      {stuckQuery.isLoading ? (
        <p className="stuck-tasks-card__hint">Загрузка…</p>
      ) : stuckQuery.isError ? (
        <p className="stuck-tasks-card__error">Не удалось загрузить список</p>
      ) : tasks.length === 0 ? (
        <p className="stuck-tasks-card__empty">Нет застрявших задач за выбранный порог.</p>
      ) : (
        <>
          <p className="stuck-tasks-card__count">
            Найдено: {data?.count}
            {data?.truncated ? ' (показаны первые 50)' : ''}
          </p>
          <div className="stuck-tasks-card__table-wrap">
            <table className="stuck-tasks-card__table">
              <thead>
                <tr>
                  <th>Задача</th>
                  <th>Колонка</th>
                  <th>Исполнитель</th>
                  <th>Дней без обновлений</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id}>
                    <td>{task.title}</td>
                    <td>{task.columnName}</td>
                    <td>{task.assignee?.name ?? '—'}</td>
                    <td>{task.daysSinceUpdate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {insightError ? <p className="stuck-tasks-card__error">{insightError}</p> : null}
      {insight ? <div className="stuck-tasks-card__insight">{insight}</div> : null}
    </section>
  );
}
