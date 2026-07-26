import { describe, expect, it } from 'vitest';
import { buildHomeDashboardSlices } from './home-dashboard-slices';
import type { AllTask } from '../types';

function task(partial: Partial<AllTask> & { id: string }): AllTask {
  return {
    title: partial.title ?? partial.id,
    description: null,
    priority: null,
    complexity: null,
    timeEstimateMinutes: null,
    actualMinutes: null,
    dueDate: null,
    assigneeId: null,
    assignee: null,
    position: 0,
    columnId: 'c1',
    recurrenceRule: 'NONE',
    recurrenceAction: 'DUPLICATE',
    recurrenceWeekdays: [],
    recurrenceOriginColumnId: null,
    overdueDays: 0,
    timerStartedAt: null,
    completedAt: null,
    createdAt: '2026-07-01T00:00:00.000Z',
    customFields: [],
    tags: [],
    subtasks: [],
    sprintId: null,
    isEpic: false,
    epicId: null,
    board: { id: 'b1', name: 'Board' },
    column: { id: 'c1', name: 'Todo' },
    ...partial,
  };
}

describe('buildHomeDashboardSlices', () => {
  it('limits overdue and builds next actions from dueSoon then assigned', () => {
    const slices = buildHomeDashboardSlices(
      {
        overdue: [task({ id: 'o1' }), task({ id: 'o2' }), task({ id: 'o3' })],
        dueSoon: [task({ id: 'd1' }), task({ id: 'd2' })],
        assigned: [task({ id: 'a1' }), task({ id: 'a2' }), task({ id: 'a3' })],
        watching: [task({ id: 'w1' })],
      },
      [],
      2,
    );

    expect(slices.overdue.map((t) => t.id)).toEqual(['o1', 'o2']);
    expect(slices.nextActions.map((t) => t.id)).toEqual(['d1', 'd2']);
    expect(slices.counts).toEqual({
      overdue: 3,
      dueSoon: 2,
      assigned: 3,
      open: 9,
    });
  });

  it('fills next actions with assigned when dueSoon is short', () => {
    const slices = buildHomeDashboardSlices(
      {
        overdue: [],
        dueSoon: [task({ id: 'd1' })],
        assigned: [task({ id: 'a1' }), task({ id: 'a2' })],
        watching: [],
      },
      [],
      3,
    );

    expect(slices.nextActions.map((t) => t.id)).toEqual(['d1', 'a1', 'a2']);
  });

  it('prefers recentCandidates when provided', () => {
    const slices = buildHomeDashboardSlices(
      {
        overdue: [task({ id: 'o1', createdAt: '2026-07-20T00:00:00.000Z' })],
        dueSoon: [],
        assigned: [task({ id: 'a1', createdAt: '2026-07-21T00:00:00.000Z' })],
        watching: [],
      },
      [task({ id: 'r1', createdAt: '2026-07-25T00:00:00.000Z' })],
      5,
    );

    expect(slices.recent.map((t) => t.id)).toEqual(['r1']);
  });

  it('falls back to sorting my-tasks by createdAt for recent', () => {
    const slices = buildHomeDashboardSlices(
      {
        overdue: [task({ id: 'o1', createdAt: '2026-07-10T00:00:00.000Z' })],
        dueSoon: [task({ id: 'd1', createdAt: '2026-07-22T00:00:00.000Z' })],
        assigned: [task({ id: 'a1', createdAt: '2026-07-20T00:00:00.000Z' })],
        watching: [],
      },
      [],
      2,
    );

    expect(slices.recent.map((t) => t.id)).toEqual(['d1', 'a1']);
  });
});
