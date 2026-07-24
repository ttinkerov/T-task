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
  /** Toggle body only */
  body?: string;
};

export type DescriptionDoc = {
  version: typeof DESCRIPTION_DOC_VERSION;
  blocks: DescriptionBlock[];
};

const MAX_BLOCKS = 80;
const MAX_BLOCK_TEXT = 2000;
const MAX_PLAIN_LENGTH = 2000;
const BLOCK_ID_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;

export function isDescriptionBlockType(value: unknown): value is DescriptionBlockType {
  return (
    typeof value === 'string' && (DESCRIPTION_BLOCK_TYPES as readonly string[]).includes(value)
  );
}

export function descriptionDocFromPlain(plain: string | null | undefined): DescriptionDoc {
  const text = (plain ?? '').trim();
  return {
    version: DESCRIPTION_DOC_VERSION,
    blocks: [
      {
        id: 'legacy',
        type: 'paragraph',
        text: text.slice(0, MAX_BLOCK_TEXT),
      },
    ],
  };
}

export function plainTextFromDescriptionDoc(doc: DescriptionDoc): string {
  const parts: string[] = [];
  for (const block of doc.blocks) {
    const line = block.text.trim();
    if (line) parts.push(line);
    if (block.type === 'toggle' && block.body?.trim()) {
      parts.push(block.body.trim());
    }
  }
  return parts.join('\n').slice(0, MAX_PLAIN_LENGTH);
}

export function parseDescriptionDoc(value: unknown): DescriptionDoc {
  if (value === null || value === undefined) {
    throw new Error('DESCRIPTION_DOC_REQUIRED');
  }
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('DESCRIPTION_DOC_INVALID');
  }

  const raw = value as Record<string, unknown>;
  if (raw.version !== DESCRIPTION_DOC_VERSION) {
    throw new Error('DESCRIPTION_DOC_VERSION');
  }
  if (!Array.isArray(raw.blocks)) {
    throw new Error('DESCRIPTION_DOC_BLOCKS');
  }
  if (raw.blocks.length === 0 || raw.blocks.length > MAX_BLOCKS) {
    throw new Error('DESCRIPTION_DOC_BLOCKS_COUNT');
  }

  const blocks: DescriptionBlock[] = raw.blocks.map((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new Error(`DESCRIPTION_DOC_BLOCK_${index}`);
    }
    const block = item as Record<string, unknown>;
    if (typeof block.id !== 'string' || !BLOCK_ID_PATTERN.test(block.id)) {
      throw new Error(`DESCRIPTION_DOC_BLOCK_ID_${index}`);
    }
    if (!isDescriptionBlockType(block.type)) {
      throw new Error(`DESCRIPTION_DOC_BLOCK_TYPE_${index}`);
    }
    if (typeof block.text !== 'string') {
      throw new Error(`DESCRIPTION_DOC_BLOCK_TEXT_${index}`);
    }
    const text = block.text.slice(0, MAX_BLOCK_TEXT);
    if (block.type === 'toggle') {
      const body = typeof block.body === 'string' ? block.body.slice(0, MAX_BLOCK_TEXT) : '';
      return { id: block.id, type: 'toggle', text, body };
    }
    return { id: block.id, type: block.type, text };
  });

  return { version: DESCRIPTION_DOC_VERSION, blocks };
}

export function normalizeDescriptionDocInput(
  descriptionDoc: unknown | undefined,
  description: string | null | undefined,
): { doc: DescriptionDoc | null; plain: string | null } | 'unchanged' {
  if (descriptionDoc === undefined && description === undefined) {
    return 'unchanged';
  }

  if (descriptionDoc === null && description === null) {
    return { doc: null, plain: null };
  }

  if (descriptionDoc === null) {
    if (description === undefined) {
      return { doc: null, plain: null };
    }
    const plain = description?.trim() || null;
    if (!plain) {
      return { doc: null, plain: null };
    }
    return { doc: descriptionDocFromPlain(plain), plain };
  }

  if (description === null && descriptionDoc === undefined) {
    return { doc: null, plain: null };
  }

  if (descriptionDoc !== undefined) {
    const doc = parseDescriptionDoc(descriptionDoc);
    const plain = plainTextFromDescriptionDoc(doc) || null;
    return { doc: plain ? doc : null, plain };
  }

  const plain = description?.trim() || null;
  if (!plain) {
    return { doc: null, plain: null };
  }
  return { doc: descriptionDocFromPlain(plain), plain };
}

export function resolveDescriptionDocForApi(
  descriptionDoc: unknown,
  description: string | null,
): DescriptionDoc | null {
  if (descriptionDoc != null) {
    try {
      return parseDescriptionDoc(descriptionDoc);
    } catch {
      // fall through to legacy plain text
    }
  }
  if (description?.trim()) {
    return descriptionDocFromPlain(description);
  }
  return null;
}
