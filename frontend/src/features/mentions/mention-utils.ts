export interface MentionTrigger {
  start: number;
  end: number;
  query: string;
}

export type MentionToken =
  { type: 'text'; value: string } | { type: 'mention'; value: string; userId: string };

const MENTION_PATTERN = /@\[([^\]\r\n]{1,120})\]\(([A-Za-z0-9_-]{20,36})\)/g;

export function findMentionTrigger(text: string, cursor: number): MentionTrigger | null {
  const beforeCursor = text.slice(0, cursor);
  const match = /(^|\s)@([^\s@]{0,60})$/.exec(beforeCursor);
  if (!match || match.index === undefined) return null;

  return {
    start: match.index + match[1].length,
    end: cursor,
    query: match[2],
  };
}

export function insertMention(
  text: string,
  trigger: MentionTrigger,
  user: { id: string; name: string },
) {
  const safeName = user.name
    .replace(/[[\]()\r\n]/g, '')
    .trim()
    .slice(0, 120);
  const mention = `@[${safeName}](${user.id})`;
  const suffix = text.slice(trigger.end);
  const needsSpace = suffix.length === 0 || !/^\s/.test(suffix);
  const separator = needsSpace ? ' ' : '';
  const nextText = `${text.slice(0, trigger.start)}${mention}${separator}${suffix}`;
  const cursor = trigger.start + mention.length + (needsSpace || /^\s/.test(suffix) ? 1 : 0);

  return { text: nextText, cursor };
}

export function tokenizeMentions(text: string): MentionToken[] {
  const tokens: MentionToken[] = [];
  let offset = 0;

  for (const match of text.matchAll(MENTION_PATTERN)) {
    const index = match.index ?? 0;
    if (index > offset) {
      tokens.push({ type: 'text', value: text.slice(offset, index) });
    }
    tokens.push({
      type: 'mention',
      value: `@${match[1]}`,
      userId: match[2],
    });
    offset = index + match[0].length;
  }

  if (offset < text.length) {
    tokens.push({ type: 'text', value: text.slice(offset) });
  }

  return tokens;
}
