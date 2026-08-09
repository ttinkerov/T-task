import { RAG_CHUNK_MAX_CHARS, RAG_CHUNK_OVERLAP_CHARS } from './rag.constants';

export type DescriptionDocLike = {
  type?: string;
  content?: unknown[];
  text?: string;
};

function collectText(node: unknown, parts: string[]): void {
  if (node == null) return;
  if (typeof node === 'string') {
    const trimmed = node.trim();
    if (trimmed) parts.push(trimmed);
    return;
  }
  if (Array.isArray(node)) {
    for (const child of node) collectText(child, parts);
    return;
  }
  if (typeof node !== 'object') return;

  const record = node as DescriptionDocLike & Record<string, unknown>;
  if (typeof record.text === 'string' && record.text.trim()) {
    parts.push(record.text.trim());
  }
  if (Array.isArray(record.content)) {
    for (const child of record.content) collectText(child, parts);
  }
}

export function flattenDescriptionDoc(doc: unknown): string {
  if (doc == null) return '';
  if (typeof doc === 'string') return doc.trim();
  const parts: string[] = [];
  collectText(doc, parts);
  return parts
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function taskToPlainText(input: {
  title: string;
  description?: string | null;
  descriptionDoc?: unknown;
}): string {
  const title = input.title.trim();
  const fromDoc = flattenDescriptionDoc(input.descriptionDoc);
  const fromPlain = (input.description ?? '').trim();
  const body = fromDoc || fromPlain;
  if (!body) return title;
  return `${title}\n\n${body}`.trim();
}

export function commentToPlainText(input: { body: string; taskTitle?: string | null }): string {
  const body = input.body.trim();
  const taskTitle = input.taskTitle?.trim();
  if (!taskTitle) return body;
  return `Комментарий к задаче «${taskTitle}»:\n${body}`.trim();
}

export function contextualizeChunk(input: {
  sourceType: 'TASK' | 'COMMENT';
  title: string;
  chunk: string;
}): string {
  const title = input.title.trim() || 'без названия';
  const label = input.sourceType === 'TASK' ? 'Задача' : 'Комментарий';
  return `${label}: ${title}\n\n${input.chunk.trim()}`.trim();
}

export function chunkText(
  text: string,
  maxChars = RAG_CHUNK_MAX_CHARS,
  overlapChars = RAG_CHUNK_OVERLAP_CHARS,
): string[] {
  const normalized = text.replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];
  if (normalized.length <= maxChars) return [normalized];

  const chunks: string[] = [];
  let start = 0;

  while (start < normalized.length) {
    let end = Math.min(start + maxChars, normalized.length);
    if (end < normalized.length) {
      const window = normalized.slice(start, end);
      const breakAt = Math.max(
        window.lastIndexOf('\n\n'),
        window.lastIndexOf('\n'),
        window.lastIndexOf('. '),
        window.lastIndexOf(' '),
      );
      if (breakAt > maxChars * 0.35) {
        end = start + breakAt + (window[breakAt] === '.' ? 1 : 0);
      }
    }

    const slice = normalized.slice(start, end).trim();
    if (slice) chunks.push(slice);
    if (end >= normalized.length) break;

    const nextStart = Math.max(0, end - overlapChars);
    start = nextStart <= start ? end : nextStart;
  }

  return chunks;
}
