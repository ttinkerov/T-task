import { describe, expect, it } from 'vitest';
import { hydrateDescriptionDoc, isDescriptionDocEmpty, plainTextFromDescriptionDoc } from './types';

describe('task description doc helpers', () => {
  it('hydrates legacy plain text into a paragraph block', () => {
    const doc = hydrateDescriptionDoc(null, 'Старое описание');
    expect(doc.blocks).toHaveLength(1);
    expect(doc.blocks[0]?.type).toBe('paragraph');
    expect(doc.blocks[0]?.text).toBe('Старое описание');
    expect(doc.blocks[0]?.id).toBe('legacy');
  });

  it('keeps a stable empty doc id across calls', () => {
    expect(hydrateDescriptionDoc(null, null).blocks[0]?.id).toBe('empty');
    expect(hydrateDescriptionDoc(null, '  ').blocks[0]?.id).toBe('empty');
  });

  it('prefers structured doc over plain text', () => {
    const doc = hydrateDescriptionDoc(
      {
        version: 1,
        blocks: [{ id: 'a', type: 'heading1', text: 'Цели' }],
      },
      'ignored',
    );
    expect(doc.blocks[0]?.type).toBe('heading1');
  });

  it('flattens blocks to plain text for AI and cards', () => {
    const plain = plainTextFromDescriptionDoc({
      version: 1,
      blocks: [
        { id: 'a', type: 'callout', text: 'Важно' },
        { id: 'b', type: 'toggle', text: 'Детали', body: 'Скрыто' },
      ],
    });
    expect(plain).toBe('Важно\nДетали\nСкрыто');
    expect(
      isDescriptionDocEmpty({ version: 1, blocks: [{ id: 'x', type: 'paragraph', text: '  ' }] }),
    ).toBe(true);
  });
});
