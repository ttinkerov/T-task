import { describe, expect, it } from 'vitest';
import { parseJiraCsv, splitCsvRows } from './parse-csv';
import { mapPriority } from './map-priority';
import { mapDueDate } from './map-due-date';

describe('parseJiraCsv', () => {
  it('parses jira-like headers and quoted commas', () => {
    const csv = [
      'Summary,Status,Priority,Assignee,Description,Due Date,Labels',
      '"Fix login, please",To Do,High,anna@example.com,"Line 1, still",2024-05-01,"Bug,Frontend"',
      'Done item,Done,Low,,,,"",',
    ].join('\n');

    const parsed = parseJiraCsv(csv);
    expect(parsed.rows).toHaveLength(2);
    expect(parsed.rows[0].title).toBe('Fix login, please');
    expect(parsed.rows[0].labels).toEqual(['Bug', 'Frontend']);
    expect(parsed.statuses).toContain('To Do');
  });

  it('supports multiline quoted fields', () => {
    const csv = 'Summary,Status,Description\n"Title","To Do","Hello\nWorld"\n';
    const rows = splitCsvRows(csv);
    expect(rows).toHaveLength(2);
    const parsed = parseJiraCsv(csv);
    expect(parsed.rows[0].description).toBe('Hello\nWorld');
  });
});

describe('mapPriority / mapDueDate', () => {
  it('maps jira priorities', () => {
    expect(mapPriority('Highest')).toBe('URGENT');
    expect(mapPriority('Medium')).toBe('MEDIUM');
    expect(mapPriority('unknown')).toBeUndefined();
  });

  it('maps due dates', () => {
    expect(mapDueDate('2024-05-01')).toBe('2024-05-01');
    expect(mapDueDate('01.05.2024')).toBe('2024-05-01');
    expect(mapDueDate('03/04/2024')).toBe('2024-03-04');
    expect(mapDueDate('25/04/2024')).toBe('2024-04-25');
  });
});
