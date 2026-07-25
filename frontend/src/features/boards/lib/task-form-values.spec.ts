import { describe, expect, it } from 'vitest';
import { buildTaskUpdatePayload, toDateInputValue, toFormValues } from './task-form-values';
import type { BoardTask } from '../types';

const task = {
  id: 't1',
  title: 'Title',
  description: 'Body',
  priority: 'HIGH',
  complexity: 3,
  timeEstimateMinutes: 60,
  actualMinutes: 30,
  dueDate: '2026-07-25T12:00:00.000Z',
  assigneeId: 'u1',
  sprintId: 's1',
  epicId: null,
  isEpic: false,
  columnId: 'c1',
  recurrenceRule: 'NONE',
  recurrenceAction: 'DUPLICATE',
  recurrenceWeekdays: [],
  recurrenceOriginColumnId: null,
} as unknown as BoardTask;

describe('toDateInputValue', () => {
  it('slices ISO date', () => {
    expect(toDateInputValue('2026-07-25T12:00:00.000Z')).toBe('2026-07-25');
    expect(toDateInputValue(null)).toBe('');
  });
});

describe('buildTaskUpdatePayload', () => {
  it('builds payload from form values', () => {
    const values = toFormValues(task);
    const payload = buildTaskUpdatePayload(values, task);
    expect(payload.title).toBe('Title');
    expect(payload.priority).toBe('HIGH');
    expect(payload.recurrenceOriginColumnId).toBeNull();
  });
});
