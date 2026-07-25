import { describe, expect, it } from 'vitest';
import { buildEpicStickyLanes, stickyColorForTask } from './epic-sticky-lanes';
import type { AllTask } from '@/features/all-tasks';

function task(partial: Partial<AllTask> & Pick<AllTask, 'id' | 'columnId' | 'board'>): AllTask {
  return {
    title: 'Task',
    position: 0,
    isEpic: false,
    epicId: 'epic-1',
    column: { id: partial.columnId, name: 'Col' },
    ...partial,
  } as AllTask;
}

describe('buildEpicStickyLanes', () => {
  const columns = [
    { id: 'c1', name: 'Todo' },
    { id: 'c2', name: 'Doing' },
  ];

  it('groups same-board children into columns and counts foreign tasks', () => {
    const children = [
      task({
        id: 't1',
        columnId: 'c1',
        position: 1,
        board: { id: 'b1', name: 'Main' },
      }),
      task({
        id: 't2',
        columnId: 'c2',
        position: 0,
        board: { id: 'b1', name: 'Main' },
      }),
      task({
        id: 't3',
        columnId: 'other',
        board: { id: 'b2', name: 'Other' },
      }),
    ];

    const result = buildEpicStickyLanes(columns, children, 'b1');
    expect(result.foreignCount).toBe(1);
    expect(result.lanes[0]?.tasks.map((item) => item.id)).toEqual(['t1']);
    expect(result.lanes[1]?.tasks.map((item) => item.id)).toEqual(['t2']);
  });
});

describe('stickyColorForTask', () => {
  it('returns a stable color for the same id', () => {
    expect(stickyColorForTask('abc')).toBe(stickyColorForTask('abc'));
  });
});
