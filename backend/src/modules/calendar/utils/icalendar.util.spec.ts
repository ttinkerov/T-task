import { describe, expect, it } from 'vitest';
import { buildTaskCalendar } from './icalendar.util';

const NOW = new Date('2026-07-17T00:00:00.000Z');

function unfoldCalendar(calendar: string): string {
  return calendar.replace(/\r\n[ \t]/g, '');
}

describe('buildTaskCalendar', () => {
  it('builds a standards-compliant all-day calendar for task deadlines', () => {
    const calendar = buildTaskCalendar({
      calendarName: 'T-task — Мои задачи',
      now: NOW,
      tasks: [
        {
          id: 'task-1',
          title: 'Подготовить релиз',
          description: 'Проверить changelog',
          dueDate: new Date('2026-07-20T12:00:00.000Z'),
          updatedAt: new Date('2026-07-16T18:15:00.000Z'),
          completedAt: null,
          boardName: 'Продукт',
        },
      ],
    });

    expect(calendar).toContain('BEGIN:VCALENDAR\r\n');
    expect(calendar).toContain('PRODID:-//T-task//Task Calendar//RU\r\n');
    expect(calendar).toContain('X-WR-CALNAME:T-task — Мои задачи\r\n');
    expect(calendar).toContain('UID:task-1@t-task\r\n');
    expect(calendar).toContain('DTSTART;VALUE=DATE:20260720\r\n');
    expect(calendar).toContain('DTEND;VALUE=DATE:20260721\r\n');
    expect(calendar).toContain('SUMMARY:Подготовить релиз\r\n');
    expect(calendar).toContain('TRANSP:TRANSPARENT\r\n');
    expect(calendar.endsWith('END:VCALENDAR\r\n')).toBe(true);
  });

  it('escapes untrusted task text and never permits property injection', () => {
    const calendar = buildTaskCalendar({
      calendarName: 'Работа, дом',
      now: NOW,
      tasks: [
        {
          id: 'task-2',
          title: 'Строка, точка; перенос\nATTENDEE:mailto:attacker@example.com',
          description: 'Слеш \\ и\r\nвторая строка',
          dueDate: new Date('2026-07-21T12:00:00.000Z'),
          updatedAt: NOW,
          completedAt: null,
          boardName: 'Доска',
        },
      ],
    });
    const unfolded = unfoldCalendar(calendar);

    expect(unfolded).toContain('X-WR-CALNAME:Работа\\, дом\r\n');
    expect(unfolded).toContain(
      'SUMMARY:Строка\\, точка\\; перенос\\nATTENDEE:mailto:attacker@example.com\r\n',
    );
    expect(unfolded).toContain('DESCRIPTION:Слеш \\\\ и\\nвторая строка\\nДоска: Доска\r\n');
    expect(unfolded).not.toContain('\r\nATTENDEE:mailto:attacker@example.com\r\n');
  });

  it('marks completed tasks without turning deadlines into busy time', () => {
    const calendar = buildTaskCalendar({
      calendarName: 'Мои задачи',
      now: NOW,
      tasks: [
        {
          id: 'task-3',
          title: 'Готовая задача',
          description: null,
          dueDate: new Date('2026-07-22T12:00:00.000Z'),
          updatedAt: NOW,
          completedAt: new Date('2026-07-17T00:00:00.000Z'),
          boardName: 'Личное',
        },
      ],
    });

    expect(calendar).toContain('STATUS:CANCELLED\r\n');
    expect(calendar).toContain('X-T-TASK-COMPLETED-AT:20260717T000000Z\r\n');
    expect(calendar).toContain('TRANSP:TRANSPARENT\r\n');
  });

  it('folds long UTF-8 content to at most 75 octets per physical line', () => {
    const calendar = buildTaskCalendar({
      calendarName: 'Календарь',
      now: NOW,
      tasks: [
        {
          id: 'task-4',
          title: 'Очень длинный заголовок задачи '.repeat(8),
          description: null,
          dueDate: new Date('2026-07-23T12:00:00.000Z'),
          updatedAt: NOW,
          completedAt: null,
          boardName: 'Доска',
        },
      ],
    });

    for (const line of calendar.split('\r\n').filter(Boolean)) {
      expect(Buffer.byteLength(line, 'utf8')).toBeLessThanOrEqual(75);
    }
    expect(calendar).toContain('\r\n ');
  });
});
