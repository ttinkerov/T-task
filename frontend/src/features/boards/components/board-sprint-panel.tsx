'use client';

import { FormEvent, useMemo, useState } from 'react';
import {
  useCloseSprintMutation,
  useCreateSprintMutation,
  useSprintBurndownQuery,
  useSprintsQuery,
} from '@/features/sprints';

export function BoardSprintPanel({ workspaceId }: { workspaceId: string }) {
  const { data: sprints = [] } = useSprintsQuery(workspaceId);
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
          </p>
        </div>
      ) : null}
    </div>
  );
}
