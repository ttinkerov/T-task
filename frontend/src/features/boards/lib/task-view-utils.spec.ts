import { describe, expect, it } from 'vitest';
import { buildMonthGrid, buildWeekDays, getTimelinePlacement, toDateKey } from './task-view-utils';

describe('task view date utilities', () => {
  it('builds a Monday-first seven-day week', () => {
    const days = buildWeekDays(new Date('2026-07-17T12:00:00.000Z'));

    expect(days).toHaveLength(7);
    expect(days.map(toDateKey)).toEqual([
      '2026-07-13',
      '2026-07-14',
      '2026-07-15',
      '2026-07-16',
      '2026-07-17',
      '2026-07-18',
      '2026-07-19',
    ]);
  });

  it('builds a stable six-week month grid starting on Monday', () => {
    const days = buildMonthGrid(new Date('2026-07-17T12:00:00.000Z'));

    expect(days).toHaveLength(42);
    expect(toDateKey(days[0])).toBe('2026-06-29');
    expect(toDateKey(days[41])).toBe('2026-08-09');
  });

  it('places due tasks on a Gantt range and clamps long tasks', () => {
    const placement = getTimelinePlacement(
      {
        createdAt: '2026-07-01T12:00:00.000Z',
        dueDate: '2026-07-20T12:00:00.000Z',
      },
      new Date('2026-07-13T12:00:00.000Z'),
      14,
    );

    expect(placement).toEqual({ startIndex: 0, span: 8 });
  });

  it('returns null for undated or out-of-range Gantt tasks', () => {
    const rangeStart = new Date('2026-07-13T12:00:00.000Z');

    expect(
      getTimelinePlacement(
        { createdAt: '2026-07-01T00:00:00.000Z', dueDate: null },
        rangeStart,
        14,
      ),
    ).toBeNull();
    expect(
      getTimelinePlacement(
        {
          createdAt: '2026-06-01T00:00:00.000Z',
          dueDate: '2026-06-03T00:00:00.000Z',
        },
        rangeStart,
        14,
      ),
    ).toBeNull();
  });
});
