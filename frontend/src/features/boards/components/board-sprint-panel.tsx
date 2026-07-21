'use client';

import { FormEvent, useMemo, useState } from 'react';
import {
  useCloseSprintMutation,
  useCreateSprintMutation,
  useSprintBurndownQuery,
  useSprintVelocityQuery,
  useSprintsQuery,
} from '@/features/sprints';

export function BoardSprintPanel({ workspaceId }: { workspaceId: string }) {
  const { data: sprints = [] } = useSprintsQuery(workspaceId);
  const { data: velocity } = useSprintVelocityQuery(workspaceId);
  const createMutation = useCreateSprintMutation(workspaceId);
  const closeMutation = useCloseSprintMutation(workspaceId);
  const active =
    sprints.find((sprint) => sprint.active) ?? sprints.find((s) => !s.closedAt) ?? null;
  const { data: burndown } = useSprintBurndownQuery(workspaceId, active?.id ?? null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const maxRemaining = useMemo(() => {
    if (!burndown?.days.length) return 1;
    return Math.max(1, ...burndown.days.map((day) => Math.max(day.remaining, day.ideal)));
  }, [burndown]);

  const activePoints = useMemo(() => {
    if (!active || !velocity) return null;
    return velocity.sprints.find((item) => item.sprintId === active.id) ?? null;
  }, [active, velocity]);

  const velocityMax = useMemo(() => {
    if (!velocity?.sprints.length) return 1;
    return Math.max(
      1,
      velocity.averageVelocity,
      ...velocity.sprints.map((item) => Math.max(item.completedPoints, item.committedPoints)),
    );
  }, [velocity]);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !startDate || !endDate) return;
    await createMutation.mutateAsync({
      name: name.trim(),
      startDate: new Date(`${startDate}T00:00:00`).toISOString(),
      endDate: new Date(`${endDate}T23:59:59`).toISOString(),
    });
    setOpen(false);
    setName('');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="board-sprint-panel">
      <div className="board-sprint-panel__head">
        <div>
          <p className="board-sprint-panel__eyebrow">Спринт</p>
          <strong>{active ? active.name : 'Нет активного спринта'}</strong>
        </div>
        <div className="board-sprint-panel__actions">
          {active && !active.closedAt ? (
            <button
              type="button"
              className="btn-ghost"
              disabled={closeMutation.isPending}
              onClick={() => void closeMutation.mutateAsync(active.id)}
            >
              Закрыть
            </button>
          ) : null}
          <button type="button" className="btn-ghost" onClick={() => setOpen((value) => !value)}>
            {open ? 'Скрыть' : 'Новый'}
          </button>
        </div>
      </div>

      {open ? (
        <form className="board-sprint-panel__form" onSubmit={(event) => void handleCreate(event)}>
          <input
            className="glass-input"
            placeholder="Название спринта"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={120}
            required
          />
          <input
            className="glass-input"
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            required
          />
          <input
            className="glass-input"
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            required
          />
          <button type="submit" className="btn-primary" disabled={createMutation.isPending}>
            Создать
          </button>
        </form>
      ) : null}

      {activePoints ? (
        <p className="board-sprint-panel__meta board-sprint-panel__meta--points">
          Очки: {activePoints.completedPoints} / {activePoints.committedPoints} SP
          {velocity && velocity.averageVelocity > 0
            ? ` · velocity ${velocity.averageVelocity}`
            : ''}
        </p>
      ) : null}

      {burndown && burndown.days.length > 0 ? (
        <div className="board-sprint-panel__chart" aria-label="Burndown">
          <svg viewBox={`0 0 ${burndown.days.length * 24} 80`} role="img">
            <polyline
              fill="none"
              stroke="var(--tt-border)"
              strokeWidth="2"
              points={burndown.days
                .map((day, index) => `${index * 24 + 8},${76 - (day.ideal / maxRemaining) * 64}`)
                .join(' ')}
            />
            <polyline
              fill="none"
              stroke="var(--tt-brand)"
              strokeWidth="2.5"
              points={burndown.days
                .map(
                  (day, index) => `${index * 24 + 8},${76 - (day.remaining / maxRemaining) * 64}`,
                )
                .join(' ')}
            />
          </svg>
          <p className="board-sprint-panel__meta">
            Осталось {burndown.days.at(-1)?.remaining ?? 0} из {burndown.total}
            {typeof burndown.totalPoints === 'number'
              ? ` · ${burndown.days.at(-1)?.remainingPoints ?? 0}/${burndown.totalPoints} SP`
              : ''}
          </p>
        </div>
      ) : null}

      {velocity && velocity.sprints.length > 0 ? (
        <div className="board-sprint-panel__velocity" aria-label="Velocity">
          <p className="board-sprint-panel__eyebrow">Velocity</p>
          <div className="board-sprint-panel__bars">
            {velocity.sprints.map((item) => {
              const completedHeight = Math.max(4, (item.completedPoints / velocityMax) * 100);
              const committedHeight = Math.max(4, (item.committedPoints / velocityMax) * 100);
              return (
                <div key={item.sprintId} className="board-sprint-panel__bar-col" title={item.name}>
                  <div className="board-sprint-panel__bar-track">
                    <span
                      className="board-sprint-panel__bar board-sprint-panel__bar--committed"
                      style={{ height: `${committedHeight}%` }}
                    />
                    <span
                      className="board-sprint-panel__bar board-sprint-panel__bar--completed"
                      style={{ height: `${completedHeight}%` }}
                    />
                  </div>
                  <span className="board-sprint-panel__bar-label">{item.completedPoints}</span>
                </div>
              );
            })}
          </div>
          <p className="board-sprint-panel__meta">
            Средняя velocity по закрытым спринтам:{' '}
            {velocity.averageVelocity > 0 ? `${velocity.averageVelocity} SP` : '—'}
          </p>
        </div>
      ) : null}
    </div>
  );
}
