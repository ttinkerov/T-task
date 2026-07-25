import { describe, expect, it } from 'vitest';
import {
  extractWikiLinks,
  findWikiLinkTrigger,
  insertWikiLink,
  tokenizeWikiLinks,
} from './wiki-link-utils';

describe('wiki-link utilities', () => {
  it('finds a [[ trigger at the cursor', () => {
    expect(findWikiLinkTrigger('См. [[онбо', 11)).toEqual({
      start: 4,
      end: 11,
      query: 'онбо',
    });
    expect(findWikiLinkTrigger('См. [ссылка]', 12)).toBeNull();
  });

  it('does not treat a completed wiki-link as an open trigger', () => {
    const text = 'См. [[Онбординг]](cm12345678901234567890) дальше';
    expect(findWikiLinkTrigger(text, text.length)).toBeNull();
  });

  it('inserts a structured wiki-link while preserving surrounding text', () => {
    expect(
      insertWikiLink(
        'См. [[онбо сегодня',
        { start: 4, end: 10, query: 'онбо' },
        {
          id: 'cm12345678901234567890',
          title: 'Онбординг',
        },
      ),
    ).toEqual({
      text: 'См. [[Онбординг]](cm12345678901234567890) сегодня',
      cursor: 42,
    });
  });

  it('tokenizes wiki-links without treating markdown links as wiki', () => {
    expect(
      tokenizeWikiLinks('См. [[Онбординг]](cm12345678901234567890) и [док](https://example.com)'),
    ).toEqual([
      { type: 'text', value: 'См. ' },
      {
        type: 'wiki-link',
        value: 'Онбординг',
        taskId: 'cm12345678901234567890',
      },
      { type: 'text', value: ' и [док](https://example.com)' },
    ]);
  });

  it('extracts unique wiki-links in document order', () => {
    const id = 'cm12345678901234567890';
    const other = 'cmabcdefghijklmnopqrstuv';
    expect(extractWikiLinks(`A [[One]](${id}) B [[Two]](${other}) C [[One]](${id})`)).toEqual([
      { title: 'One', taskId: id },
      { title: 'Two', taskId: other },
    ]);
  });
});
