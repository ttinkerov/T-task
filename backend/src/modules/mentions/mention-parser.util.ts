const ENTITY_ID_PATTERN = '[A-Za-z0-9_-]{20,36}';
const MENTION_PATTERN = new RegExp(`@\\[([^\\]\\r\\n]{1,120})\\]\\((${ENTITY_ID_PATTERN})\\)`, 'g');

export function extractMentionUserIds(text: string | null | undefined): string[] {
  if (!text) return [];

  const ids = new Set<string>();
  for (const match of text.matchAll(MENTION_PATTERN)) {
    ids.add(match[2]);
  }
  return [...ids];
}

export function sanitizeMentionLabels(
  text: string,
  namesById: ReadonlyMap<string, string>,
): string {
  return text.replace(MENTION_PATTERN, (mention, _label: string, userId: string) => {
    const currentName = namesById.get(userId);
    if (!currentName) return mention;

    const safeLabel = currentName
      .replace(/[[\]()\r\n]/g, '')
      .trim()
      .slice(0, 120);
    return safeLabel ? `@[${safeLabel}](${userId})` : mention;
  });
}
