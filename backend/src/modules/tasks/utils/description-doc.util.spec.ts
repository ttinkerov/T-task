import { describe, expect, it } from 'vitest';
import {
  descriptionDocFromPlain,
  normalizeDescriptionDocInput,
  parseDescriptionDoc,
  plainTextFromDescriptionDoc,
  resolveDescriptionDocForApi,
} from './description-doc.util';

describe('description-doc.util', () => {
  it('parses a valid document', () => {
    const doc = parseDescriptionDoc({
      version: 1,
      blocks: [
        { id: 'a', type: 'heading1', text: 'Цели' },
        { id: 'b', type: 'bullet', text: 'Шаг 1' },
        { id: 'c', type: 'toggle', text: 'Детали', body: 'Скрытый текст' },
      ],
    });
    expect(doc.blocks).toHaveLength(3);
    expect(plainTextFromDescriptionDoc(doc)).toContain('Скрытый текст');
  });

  it('rejects unknown block types', () => {
    expect(() =>
      parseDescriptionDoc({
        version: 1,
        blocks: [{ id: 'a', type: 'video', text: 'x' }],
      }),
    ).toThrow(/BLOCK_TYPE/);
  });

  it('hydrates legacy plain text', () => {
    const doc = descriptionDocFromPlain('Старое описание');
    expect(doc.blocks[0]?.type).toBe('paragraph');
    expect(resolveDescriptionDocForApi(null, 'Старое описание')?.blocks[0]?.text).toBe(
      'Старое описание',
    );
  });

  it('normalizes descriptionDoc updates and clears empty docs', () => {
    const cleared = normalizeDescriptionDocInput(
      { version: 1, blocks: [{ id: 'a', type: 'paragraph', text: '   ' }] },
      undefined,
    );
    expect(cleared).toEqual({ doc: null, plain: null });

    const updated = normalizeDescriptionDocInput(
      {
        version: 1,
        blocks: [
          { id: 'a', type: 'callout', text: 'Важно' },
          { id: 'b', type: 'paragraph', text: 'Текст' },
        ],
      },
      undefined,
    );
    expect(updated).not.toBe('unchanged');
    if (updated !== 'unchanged') {
      expect(updated.plain).toBe('Важно\nТекст');
      expect(updated.doc?.blocks[0]?.type).toBe('callout');
    }
  });

  it('keeps a valid descriptionDoc when description is explicitly null', () => {
    const result = normalizeDescriptionDocInput(
      {
        version: 1,
        blocks: [{ id: 'a', type: 'heading1', text: 'Цели' }],
      },
      null,
    );
    expect(result).not.toBe('unchanged');
    if (result !== 'unchanged') {
      expect(result.plain).toBe('Цели');
      expect(result.doc?.blocks[0]?.type).toBe('heading1');
    }
  });
});
