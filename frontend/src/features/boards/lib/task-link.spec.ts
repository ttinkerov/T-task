import { describe, expect, it } from 'vitest';
import { buildTaskLink } from './task-link';

describe('buildTaskLink', () => {
  it('builds board deep links', () => {
    expect(buildTaskLink('task-1', 'board')).toBe('/dashboard/board?task=task-1');
  });

  it('builds my-tasks deep links', () => {
    expect(buildTaskLink('task-1', 'my-tasks')).toBe('/dashboard/my-tasks?task=task-1');
  });
});
