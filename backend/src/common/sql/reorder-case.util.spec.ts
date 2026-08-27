import { describe, expect, it } from 'vitest';
import {
  buildColumnReorderSql,
  buildFunnelStageReorderSql,
  buildReorderSql,
  buildTaskReorderSql,
} from './reorder-case.util';

describe('buildReorderSql', () => {
  it('generates parameterised CASE UPDATE for the given table', () => {
    const sql = buildReorderSql('tasks', [
      { id: 'task-a', position: 0 },
      { id: 'task-b', position: 1 },
    ]);

    expect(sql.sql).toContain('UPDATE tasks');
    expect(sql.sql).toContain('CASE');
    expect(sql.sql).toContain('END');
    expect(sql.sql).toContain('WHERE id IN');
    expect(sql.values).toContain('task-a');
    expect(sql.values).toContain('task-b');
    expect(sql.sql).not.toContain('task-a');
    expect(sql.sql).not.toContain('task-b');
  });

  it('values contain 3×entries (id+position per CASE row, id per IN row)', () => {
    const entries = [
      { id: 'a', position: 0 },
      { id: 'b', position: 1 },
      { id: 'c', position: 2 },
    ];
    const sql = buildReorderSql('tasks', entries);
    expect(sql.values).toHaveLength(entries.length * 3);
  });

  it('parameterises ids and positions — neither appears as inline literal', () => {
    const sql = buildReorderSql('tasks', [
      { id: 'task-x', position: 3 },
      { id: 'task-y', position: 7 },
    ]);

    expect(sql.values).toEqual(expect.arrayContaining(['task-x', 3, 'task-y', 7]));
    expect(sql.sql).not.toContain('task-x');
    expect(sql.sql).not.toContain('task-y');
  });

  it('handles a single entry', () => {
    const sql = buildReorderSql('tasks', [{ id: 'solo', position: 0 }]);

    expect(sql.values).toContain('solo');
    expect(sql.values).toContain(0);
    expect(sql.sql).toContain('UPDATE tasks');
  });
});

describe('buildColumnReorderSql', () => {
  it('targets the board_columns table', () => {
    const sql = buildColumnReorderSql([{ id: 'col-1', position: 0 }]);

    expect(sql.sql).toContain('UPDATE board_columns');
    expect(sql.values).toContain('col-1');
  });

  it('parameterises ids and positions without inline literals', () => {
    const sql = buildColumnReorderSql([
      { id: 'col-x', position: 3 },
      { id: 'col-y', position: 7 },
    ]);

    expect(sql.values).toEqual(expect.arrayContaining(['col-x', 3, 'col-y', 7]));
    expect(sql.sql).not.toContain('col-x');
    expect(sql.sql).not.toContain('col-y');
  });

  it('produces 3×entries values (same contract as legacy buildColumnReorderSql)', () => {
    const entries = [
      { id: 'a', position: 0 },
      { id: 'b', position: 1 },
      { id: 'c', position: 2 },
    ];
    const sql = buildColumnReorderSql(entries);
    expect(sql.values).toHaveLength(entries.length * 2 + entries.length);
  });
});

describe('buildTaskReorderSql', () => {
  it('targets the tasks table', () => {
    const sql = buildTaskReorderSql([{ id: 'task-1', position: 0 }]);

    expect(sql.sql).toContain('UPDATE tasks');
    expect(sql.values).toContain('task-1');
  });

  it('parameterises ids and positions without inline literals', () => {
    const sql = buildTaskReorderSql([
      { id: 'task-x', position: 3 },
      { id: 'task-y', position: 7 },
    ]);

    expect(sql.values).toEqual(expect.arrayContaining(['task-x', 3, 'task-y', 7]));
    expect(sql.sql).not.toContain('task-x');
    expect(sql.sql).not.toContain('task-y');
  });

  it('handles a single entry', () => {
    const sql = buildTaskReorderSql([{ id: 'solo-task', position: 5 }]);

    expect(sql.values).toContain('solo-task');
    expect(sql.values).toContain(5);
  });
});

describe('buildFunnelStageReorderSql', () => {
  it('targets funnel_stages with parameterised ids', () => {
    const sql = buildFunnelStageReorderSql([
      { id: 'stage-a', position: 0 },
      { id: 'stage-b', position: 1 },
    ]);

    expect(sql.sql).toContain('UPDATE funnel_stages');
    expect(sql.values).toEqual(expect.arrayContaining(['stage-a', 0, 'stage-b', 1]));
    expect(sql.sql).not.toContain('stage-a');
  });
});
