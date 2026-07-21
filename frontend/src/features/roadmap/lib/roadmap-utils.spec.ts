import { describe, expect, it } from 'vitest';
import { toDateKey } from '../../boards/lib/task-view-utils';
import {
  buildMonthColumns,
  getBarPlacement,
  getEpicProgress,
  getEpicSpan,
  getRangeEnd,
  todayMarkerPct,
} from './roadmap-utils';

describe('roadmap utilities', () => {
  it('builds consecutive month columns from a range start', () => {
    const columns = buildMonthColumns(new Date('2026-07-17T12:00:00.000Z'), 3);

    expect(columns).toHaveLength(3);
    expect(columns.map((column) => column.key)).toEqual(['2026-07', '2026-08', '2026-09']);
    expect(toDateKey(columns[0].start)).toBe('2026-07-01');
    expect(toDateKey(columns[0].end)).toBe('2026-07-31');
    expect(toDateKey(getRangeEnd(new Date('2026-07-17T12:00:00.000Z'), 3))).toBe('2026-09-30');
  });

  it('aggregates epic span from due dates and clamps start after end', () => {
    const span = getEpicSpan(
      {
        createdAt: '2026-07-10T12:00:00.000Z',
        dueDate: '2026-08-20T12:00:00.000Z',
      },
      [
        { createdAt: '2026-07-12T12:00:00.000Z', dueDate: '2026-07-25T12:00:00.000Z' },
        { createdAt: '2026-07-15T12:00:00.000Z', dueDate: '2026-09-01T12:00:00.000Z' },
      ],
    );

    expect(span).not.toBeNull();
    expect(toDateKey(span!.start)).toBe('2026-07-10');
    expect(toDateKey(span!.end)).toBe('2026-09-01');
  });

  it('uses sprint dates when tasks have no due dates', () => {
    const span = getEpicSpan(
      {
        createdAt: '2026-07-01T12:00:00.000Z',
        dueDate: null,
        sprintId: 'sprint-1',
      },
      [{ createdAt: '2026-07-02T12:00:00.000Z', dueDate: null, sprintId: 'sprint-1' }],
      {
        'sprint-1': {
          id: 'sprint-1',
          startDate: '2026-07-05T00:00:00.000Z',
          endDate: '2026-07-18T00:00:00.000Z',
        },
      },
    );

    expect(span).not.toBeNull();
    expect(toDateKey(span!.start)).toBe('2026-07-01');
    expect(toDateKey(span!.end)).toBe('2026-07-18');
  });

  it('returns null for undated epics without sprint coverage', () => {
    expect(
      getEpicSpan({ createdAt: '2026-07-01T12:00:00.000Z', dueDate: null }, [
        { createdAt: '2026-07-02T12:00:00.000Z', dueDate: null },
      ]),
    ).toBeNull();
  });

  it('places bars as percentages and clamps to the visible range', () => {
    const rangeStart = new Date('2026-07-01T00:00:00.000Z');
    const rangeEnd = new Date('2026-09-30T00:00:00.000Z');
    const placement = getBarPlacement(
      {
        start: new Date('2026-06-15T00:00:00.000Z'),
        end: new Date('2026-08-15T00:00:00.000Z'),
      },
      rangeStart,
      rangeEnd,
    );

    expect(placement).not.toBeNull();
    expect(placement!.leftPct).toBe(0);
    expect(placement!.widthPct).toBeGreaterThan(40);
    expect(placement!.widthPct).toBeLessThanOrEqual(100);
  });

  it('returns null for bars completely outside the range', () => {
    expect(
      getBarPlacement(
        {
          start: new Date('2026-01-01T00:00:00.000Z'),
          end: new Date('2026-01-20T00:00:00.000Z'),
        },
        new Date('2026-07-01T00:00:00.000Z'),
        new Date('2026-09-30T00:00:00.000Z'),
      ),
    ).toBeNull();
  });

  it('computes today marker percentage inside the range', () => {
    const pct = todayMarkerPct(
      new Date('2026-07-01T00:00:00.000Z'),
      new Date('2026-09-30T00:00:00.000Z'),
      new Date('2026-08-01T12:00:00.000Z'),
    );

    expect(pct).not.toBeNull();
    expect(pct!).toBeGreaterThan(30);
    expect(pct!).toBeLessThan(40);
  });

  it('counts completed children for progress', () => {
    expect(
      getEpicProgress([
        { completedAt: '2026-07-01T00:00:00.000Z' },
        { completedAt: null },
        { completedAt: '2026-07-02T00:00:00.000Z' },
      ]),
    ).toEqual({ done: 2, total: 3 });
  });
});
