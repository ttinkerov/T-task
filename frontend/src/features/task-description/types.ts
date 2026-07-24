export const DESCRIPTION_DOC_VERSION = 1 as const;

export const DESCRIPTION_BLOCK_TYPES = [
  'paragraph',
  'heading1',
  'heading2',
  'bullet',
  'numbered',
  'callout',
  'toggle',
] as const;

export type DescriptionBlockType = (typeof DESCRIPTION_BLOCK_TYPES)[number];

export type DescriptionBlock = {
  id: string;
  type: DescriptionBlockType;
  text: string;
  body?: string;
};

export type DescriptionDoc = {
  version: typeof DESCRIPTION_DOC_VERSION;
  blocks: DescriptionBlock[];
};

export const BLOCK_TYPE_LABELS: Record<DescriptionBlockType, string> = {
  paragraph: 'Текст',
  heading1: 'Заголовок 1',
  heading2: 'Заголовок 2',
  bullet: 'Список',
  numbered: 'Нумерованный',
  callout: 'Выноска',
  toggle: 'Toggle',
};

export function createBlockId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 16);
  }
  return `b${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/** Stable empty doc ids — never mint random ids for the empty fallback. */
export function emptyDescriptionDoc(): DescriptionDoc {
  return {
    version: DESCRIPTION_DOC_VERSION,
    blocks: [{ id: 'empty', type: 'paragraph', text: '' }],
  };
}

export function descriptionDocsEqual(a: DescriptionDoc, b: DescriptionDoc): boolean {
  if (a.version !== b.version || a.blocks.length !== b.blocks.length) return false;
  for (let i = 0; i < a.blocks.length; i += 1) {
    const left = a.blocks[i];
    const right = b.blocks[i];
    if (!left || !right) return false;
    if (
      left.id !== right.id ||
      left.type !== right.type ||
      left.text !== right.text ||
      (left.body ?? '') !== (right.body ?? '')
    ) {
      return false;
    }
  }
  return true;
}

export function hydrateDescriptionDoc(
  doc: DescriptionDoc | null | undefined,
  plain: string | null | undefined,
): DescriptionDoc {
  if (doc?.version === 1 && Array.isArray(doc.blocks) && doc.blocks.length > 0) {
    return {
      version: 1,
      blocks: doc.blocks.map((block) => {
        const type = DESCRIPTION_BLOCK_TYPES.includes(block.type as DescriptionBlockType)
          ? (block.type as DescriptionBlockType)
          : 'paragraph';
        return {
          id: block.id || createBlockId(),
          type,
          text: block.text ?? '',
          ...(type === 'toggle' ? { body: block.body ?? '' } : {}),
        };
      }),
    };
  }
  if (plain?.trim()) {
    return {
      version: 1,
      blocks: [{ id: 'legacy', type: 'paragraph', text: plain }],
    };
  }
  return emptyDescriptionDoc();
}

export function plainTextFromDescriptionDoc(doc: DescriptionDoc): string {
  const parts: string[] = [];
  for (const block of doc.blocks) {
    if (block.text.trim()) parts.push(block.text.trim());
    if (block.type === 'toggle' && block.body?.trim()) {
      parts.push(block.body.trim());
    }
  }
  return parts.join('\n').slice(0, 2000);
}

export function isDescriptionDocEmpty(doc: DescriptionDoc): boolean {
  return !plainTextFromDescriptionDoc(doc).trim();
}
