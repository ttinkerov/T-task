import { describe, expect, it } from 'vitest';
import { computeDealLinkRollup, computeTaskLinkRollup, pickNearestDue } from './task-rollup';

describe('computeTaskLinkRollup', () => {
  it('computes % done, amount sum, and nearest upcoming due', () => {
    const rollup = computeTaskLinkRollup(
      [
        { completed: true, dueDate: '2026-07-10T00:00:00.000Z' },
        { completed: false, dueDate: '2026-07-28T00:00:00.000Z' },
        { completed: false, dueDate: '2026-08-01T00:00:00.000Z' },
      ],
      [{ amount: 10_000 }, { amount: null }, { amount: 5_000 }],
      new Date('2026-07-25T12:00:00.000Z'),
    );

    expect(rollup.donePercent).toBe(33);
    expect(rollup.completedTaskCount).toBe(1);
    expect(rollup.relatedTaskCount).toBe(3);
    expect(rollup.amountSum).toBe(15_000);
    expect(rollup.dealCount).toBe(3);
    expect(rollup.nearestDue).toBe('2026-07-28T00:00:00.000Z');
  });

  it('returns null % done and due when there are no related tasks', () => {
    const rollup = computeTaskLinkRollup([], [{ amount: 100 }]);
    expect(rollup.donePercent).toBeNull();
    expect(rollup.nearestDue).toBeNull();
    expect(rollup.amountSum).toBe(100);
  });
});

describe('computeDealLinkRollup', () => {
  it('computes progress over linked tasks', () => {
    const rollup = computeDealLinkRollup([
      { completed: true, dueDate: null },
      { completed: true, dueDate: '2026-07-01T00:00:00.000Z' },
      { completed: false, dueDate: null },
    ]);
    expect(rollup.donePercent).toBe(67);
    expect(rollup.linkedTaskCount).toBe(3);
  });
});

describe('pickNearestDue', () => {
  it('falls back to the most recent past due when nothing is upcoming', () => {
    expect(
      pickNearestDue(
        ['2026-07-01T00:00:00.000Z', '2026-07-10T00:00:00.000Z'],
        new Date('2026-07-25T12:00:00.000Z'),
      ),
    ).toBe('2026-07-10T00:00:00.000Z');
  });
});
