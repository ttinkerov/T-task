import { describe, expect, it } from 'vitest';
import { buildAutomationTaskUpdate } from './column-automation.util';

const NOW = new Date('2026-07-16T18:00:00.000Z');

describe('buildAutomationTaskUpdate', () => {
  it('applies assignment and starts an inactive timer', () => {
    const update = buildAutomationTaskUpdate(
      [
        { action: 'ASSIGN_USER', assigneeId: 'user-1' },
        { action: 'START_TIMER', assigneeId: null },
      ],
      { actualMinutes: 15, timerStartedAt: null, completedAt: null },
      NOW,
    );

    expect(update).toEqual({
      assigneeId: 'user-1',
      timerStartedAt: NOW,
    });
  });

  it('does not restart an already running timer', () => {
    const startedAt = new Date('2026-07-16T17:50:00.000Z');

    const update = buildAutomationTaskUpdate(
      [{ action: 'START_TIMER', assigneeId: null }],
      { actualMinutes: 5, timerStartedAt: startedAt, completedAt: null },
      NOW,
    );

    expect(update).toEqual({});
  });

  it('completes a task and records elapsed timer minutes once', () => {
    const update = buildAutomationTaskUpdate(
      [{ action: 'COMPLETE_TASK', assigneeId: null }],
      {
        actualMinutes: 5,
        timerStartedAt: new Date('2026-07-16T17:49:10.000Z'),
        completedAt: null,
      },
      NOW,
    );

    expect(update).toEqual({
      actualMinutes: 16,
      timerStartedAt: null,
      completedAt: NOW,
      overdueDays: 0,
    });
  });

  it('keeps completion idempotent', () => {
    const completedAt = new Date('2026-07-16T17:00:00.000Z');

    const update = buildAutomationTaskUpdate(
      [{ action: 'COMPLETE_TASK', assigneeId: null }],
      { actualMinutes: 5, timerStartedAt: null, completedAt },
      NOW,
    );

    expect(update).toEqual({});
  });
});
