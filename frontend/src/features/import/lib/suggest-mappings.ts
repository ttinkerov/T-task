import type { BoardColumn } from '@/features/boards/types';
import type { ImportColumnMapping } from '../types';

const STATUS_HINTS: Array<{ match: RegExp; columnHints: string[] }> = [
  {
    match: /^(to\s*do|open|new|backlog|к работе|открыт)/i,
    columnHints: ['к работе', 'todo', 'backlog', 'открыт'],
  },
  {
    match: /^(in\s*progress|doing|в работе|progress)/i,
    columnHints: ['в работе', 'progress', 'doing'],
  },
  { match: /^(done|closed|resolved|готово|закрыт)/i, columnHints: ['готово', 'done', 'закрыт'] },
  { match: /^(review|на проверке|qa)/i, columnHints: ['проверка', 'review', 'qa'] },
];

function findHintColumn(status: string, columns: BoardColumn[]): BoardColumn | undefined {
  for (const hint of STATUS_HINTS) {
    if (!hint.match.test(status.trim())) continue;
    const found = columns.find((column) =>
      hint.columnHints.some((name) => column.name.toLowerCase().includes(name)),
    );
    if (found) return found;
  }

  return columns.find((column) => column.name.toLowerCase() === status.trim().toLowerCase());
}

export function suggestColumnMappings(
  statuses: string[],
  columns: BoardColumn[],
): ImportColumnMapping[] {
  return statuses.map((status) => {
    const column = findHintColumn(status, columns);
    if (column) {
      return { status, columnId: column.id };
    }
    return { status, newColumnName: status };
  });
}
