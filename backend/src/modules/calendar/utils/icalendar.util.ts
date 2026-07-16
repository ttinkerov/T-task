const CRLF = '\r\n';
const MAX_LINE_BYTES = 75;

export interface CalendarTask {
  id: string;
  title: string;
  description: string | null;
  dueDate: Date;
  updatedAt: Date;
  completedAt: Date | null;
  boardName: string;
}

export interface BuildTaskCalendarInput {
  calendarName: string;
  tasks: CalendarTask[];
  now?: Date;
}

function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\r|\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function formatUtcTimestamp(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z');
}

function formatUtcDate(date: Date): string {
  return date.toISOString().slice(0, 10).replace(/-/g, '');
}

function nextUtcDate(date: Date): string {
  const next = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1));
  return formatUtcDate(next);
}

function takeUtf8Chunk(value: string, byteLimit: number): [string, string] {
  let chunk = '';
  let chunkBytes = 0;
  let consumedUnits = 0;

  for (const character of value) {
    const characterBytes = Buffer.byteLength(character, 'utf8');
    if (chunkBytes + characterBytes > byteLimit) {
      break;
    }

    chunk += character;
    chunkBytes += characterBytes;
    consumedUnits += character.length;
  }

  return [chunk, value.slice(consumedUnits)];
}

function foldLine(line: string): string[] {
  const folded: string[] = [];
  let remaining = line;
  let firstLine = true;

  while (Buffer.byteLength(remaining, 'utf8') > (firstLine ? MAX_LINE_BYTES : MAX_LINE_BYTES - 1)) {
    const byteLimit = firstLine ? MAX_LINE_BYTES : MAX_LINE_BYTES - 1;
    const [chunk, rest] = takeUtf8Chunk(remaining, byteLimit);
    folded.push(firstLine ? chunk : ` ${chunk}`);
    remaining = rest;
    firstLine = false;
  }

  folded.push(firstLine ? remaining : ` ${remaining}`);
  return folded;
}

function taskEvent(task: CalendarTask, now: Date): string[] {
  const description = [task.description, `Доска: ${task.boardName}`].filter(Boolean).join('\n');
  const lines = [
    'BEGIN:VEVENT',
    `UID:${escapeText(task.id)}@t-task`,
    `DTSTAMP:${formatUtcTimestamp(now)}`,
    `LAST-MODIFIED:${formatUtcTimestamp(task.updatedAt)}`,
    `DTSTART;VALUE=DATE:${formatUtcDate(task.dueDate)}`,
    `DTEND;VALUE=DATE:${nextUtcDate(task.dueDate)}`,
    `SUMMARY:${escapeText(task.title)}`,
    `DESCRIPTION:${escapeText(description)}`,
    `STATUS:${task.completedAt ? 'CANCELLED' : 'CONFIRMED'}`,
    ...(task.completedAt ? [`X-T-TASK-COMPLETED-AT:${formatUtcTimestamp(task.completedAt)}`] : []),
    'TRANSP:TRANSPARENT',
    'END:VEVENT',
  ];

  return lines;
}

export function buildTaskCalendar(input: BuildTaskCalendarInput): string {
  const now = input.now ?? new Date();
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//T-task//Task Calendar//RU',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(input.calendarName)}`,
    'X-WR-CALDESC:Дедлайны задач T-task',
    'REFRESH-INTERVAL;VALUE=DURATION:PT15M',
    'X-PUBLISHED-TTL:PT15M',
    ...input.tasks.flatMap((task) => taskEvent(task, now)),
    'END:VCALENDAR',
  ];

  return `${lines.flatMap(foldLine).join(CRLF)}${CRLF}`;
}
