import { describe, expect, it } from 'vitest';
import { partitionMyTasks } from './my-tasks-partition';

describe('partitionMyTasks', () => {
  const now = new Date('2026-07-25T12:00:00.000Z');

  it('buckets assigned tasks and keeps watching-only tasks separate', () => {
    const buckets = partitionMyTasks(
      [
        { id: 'a', dueDate: '2026-07-20T00:00:00.000Z', completedAt: null },
        { id: 'b', dueDate: '2026-07-27T00:00:00.000Z', completedAt: null },
        { id: 'c', dueDate: '2026-09-01T00:00:00.000Z', completedAt: null },
        { id: 'd', dueDate: null, completedAt: null },
      ],
      [
        { id: 'b', dueDate: '2026-07-27T00:00:00.000Z', completedAt: null },
        { id: 'w', dueDate: '2026-07-26T00:00:00.000Z', completedAt: null },
      ],
      now,
    );

    expect(buckets.overdue.map((task) => task.id)).toEqual(['a']);
    expect(buckets.dueSoon.map((task) => task.id)).toEqual(['b']);
    expect(buckets.assigned.map((task) => task.id)).toEqual(['c', 'd']);
    expect(buckets.watching.map((task) => task.id)).toEqual(['w']);
  });
});
