import type { ParsedCsvFile, ParsedCsvRow } from '../types';

const MAX_ROWS = 500;

const HEADER_ALIASES: Record<keyof Omit<ParsedCsvRow, 'labels'> | 'labels', string[]> = {
  title: ['summary', 'title', 'issue summary', 'тема', 'название', 'summary of issue'],
  status: ['status', 'статус'],
  description: ['description', 'описание'],
  priorityRaw: ['priority', 'приоритет'],
  dueDateRaw: ['due date', 'duedate', 'due', 'срок', 'дата выполнения'],
  assignee: ['assignee', 'исполнитель', 'assignee display name'],
  labels: ['labels', 'label', 'метки', 'теги'],
};

function normalizeHeader(value: string): string {
  return value
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase();
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === ',' && !inQuotes) {
      cells.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  cells.push(current);
  return cells;
}

/** Split CSV text into rows, respecting quoted newlines. */
export function splitCsvRows(text: string): string[] {
  const rows: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        current += '""';
        i += 1;
      } else {
        inQuotes = !inQuotes;
        current += char;
      }
      continue;
    }
    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && text[i + 1] === '\n') i += 1;
      if (current.trim().length > 0) rows.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  if (current.trim().length > 0) rows.push(current);
  return rows;
}

function resolveColumnIndex(headers: string[], aliases: string[]): number {
  const normalized = headers.map(normalizeHeader);
  for (const alias of aliases) {
    const index = normalized.indexOf(alias);
    if (index >= 0) return index;
  }
  return -1;
}

function cell(cells: string[], index: number): string {
  if (index < 0) return '';
  return (cells[index] ?? '').trim();
}

function parseLabels(raw: string): string[] {
  if (!raw.trim()) return [];
  return raw
    .split(/[,;]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 20);
}

export function parseJiraCsv(text: string): ParsedCsvFile {
  const warnings: string[] = [];
  const lines = splitCsvRows(text.replace(/^\uFEFF/, ''));
  if (lines.length < 2) {
    return { rows: [], statuses: [], warnings: ['Файл пуст или без строк данных'] };
  }

  const headers = parseCsvLine(lines[0]);
  const titleIdx = resolveColumnIndex(headers, HEADER_ALIASES.title);
  const statusIdx = resolveColumnIndex(headers, HEADER_ALIASES.status);

  if (titleIdx < 0) {
    return {
      rows: [],
      statuses: [],
      warnings: ['Не найдена колонка Summary / Title / Название'],
    };
  }
  if (statusIdx < 0) {
    return {
      rows: [],
      statuses: [],
      warnings: ['Не найдена колонка Status / Статус'],
    };
  }

  const descriptionIdx = resolveColumnIndex(headers, HEADER_ALIASES.description);
  const priorityIdx = resolveColumnIndex(headers, HEADER_ALIASES.priorityRaw);
  const dueDateIdx = resolveColumnIndex(headers, HEADER_ALIASES.dueDateRaw);
  const assigneeIdx = resolveColumnIndex(headers, HEADER_ALIASES.assignee);
  const labelsIdx = resolveColumnIndex(headers, HEADER_ALIASES.labels);

  const rows: ParsedCsvRow[] = [];
  const statusCounts = new Map<string, number>();

  for (let i = 1; i < lines.length; i += 1) {
    if (rows.length >= MAX_ROWS) {
      warnings.push(`Импортируются только первые ${MAX_ROWS} строк`);
      break;
    }

    const cells = parseCsvLine(lines[i]);
    const title = cell(cells, titleIdx);
    const status = cell(cells, statusIdx) || 'To Do';
    if (!title) continue;

    rows.push({
      title: title.slice(0, 200),
      status: status.slice(0, 120),
      description: cell(cells, descriptionIdx).slice(0, 2000),
      priorityRaw: cell(cells, priorityIdx),
      dueDateRaw: cell(cells, dueDateIdx),
      assignee: cell(cells, assigneeIdx).slice(0, 200),
      labels: parseLabels(cell(cells, labelsIdx)),
    });
    statusCounts.set(status, (statusCounts.get(status) ?? 0) + 1);
  }

  const statuses = [...statusCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([status]) => status);

  if (rows.length === 0) {
    warnings.push('Нет строк с заполненным заголовком');
  }

  return { rows, statuses, warnings };
}
