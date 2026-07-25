export interface WikiLinkTrigger {
  start: number;
  end: number;
  query: string;
}

export type WikiLinkToken =
  { type: 'text'; value: string } | { type: 'wiki-link'; value: string; taskId: string };

export interface WikiLinkRef {
  title: string;
  taskId: string;
}

const WIKI_LINK_PATTERN = /\[\[([^\]\r\n]{1,200})\]\]\(([A-Za-z0-9_-]{20,36})\)/g;
const TASK_ID_PATTERN = /^[A-Za-z0-9_-]{20,36}$/;

export function findWikiLinkTrigger(text: string, cursor: number): WikiLinkTrigger | null {
  const beforeCursor = text.slice(0, cursor);
  const match = /\[\[([^\]]*)$/.exec(beforeCursor);
  if (!match || match.index === undefined) return null;

  // Completed tokens look like [[Title]](id) — once `]` is typed, stop suggesting.
  if (match[1].includes('[')) return null;

  return {
    start: match.index,
    end: cursor,
    query: match[1],
  };
}

export function insertWikiLink(
  text: string,
  trigger: WikiLinkTrigger,
  task: { id: string; title: string },
) {
  if (!TASK_ID_PATTERN.test(task.id)) {
    return { text, cursor: trigger.end };
  }

  const safeTitle = task.title
    .replace(/[[\]()\r\n]/g, '')
    .trim()
    .slice(0, 200);
  const link = `[[${safeTitle || 'Задача'}]](${task.id})`;
  const suffix = text.slice(trigger.end);
  const needsSpace = suffix.length === 0 || !/^\s/.test(suffix);
  const separator = needsSpace ? ' ' : '';
  const nextText = `${text.slice(0, trigger.start)}${link}${separator}${suffix}`;
  const cursor = trigger.start + link.length + (needsSpace || /^\s/.test(suffix) ? 1 : 0);

  return { text: nextText, cursor };
}

export function tokenizeWikiLinks(text: string): WikiLinkToken[] {
  const tokens: WikiLinkToken[] = [];
  let offset = 0;

  for (const match of text.matchAll(WIKI_LINK_PATTERN)) {
    const index = match.index ?? 0;
    if (index > offset) {
      tokens.push({ type: 'text', value: text.slice(offset, index) });
    }
    tokens.push({
      type: 'wiki-link',
      value: match[1],
      taskId: match[2],
    });
    offset = index + match[0].length;
  }

  if (offset < text.length) {
    tokens.push({ type: 'text', value: text.slice(offset) });
  }

  return tokens;
}

export function extractWikiLinks(text: string): WikiLinkRef[] {
  const seen = new Set<string>();
  const links: WikiLinkRef[] = [];

  for (const token of tokenizeWikiLinks(text)) {
    if (token.type !== 'wiki-link') continue;
    if (seen.has(token.taskId)) continue;
    seen.add(token.taskId);
    links.push({ title: token.value, taskId: token.taskId });
  }

  return links;
}
