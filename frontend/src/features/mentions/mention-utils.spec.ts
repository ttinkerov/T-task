import { describe, expect, it } from 'vitest';
import { findMentionTrigger, insertMention, tokenizeMentions } from './mention-utils';

describe('mention editor utilities', () => {
  it('finds a mention trigger at the cursor after whitespace', () => {
    expect(findMentionTrigger('Проверь @ан', 11)).toEqual({
      start: 8,
      end: 11,
      query: 'ан',
    });
    expect(findMentionTrigger('email@test.ru', 13)).toBeNull();
  });

  it('inserts a structured mention while preserving surrounding text', () => {
    expect(
      insertMention(
        'Проверь @ан сегодня',
        { start: 8, end: 11, query: 'ан' },
        {
          id: 'cm12345678901234567890',
          name: 'Анна Иванова',
        },
      ),
    ).toEqual({
      text: 'Проверь @[Анна Иванова](cm12345678901234567890) сегодня',
      cursor: 48,
    });
  });

  it('tokenizes structured mentions without interpreting regular markdown links', () => {
    expect(
      tokenizeMentions('Привет @[Анна](cm12345678901234567890), [документ](https://example.com)'),
    ).toEqual([
      { type: 'text', value: 'Привет ' },
      {
        type: 'mention',
        value: '@Анна',
        userId: 'cm12345678901234567890',
      },
      { type: 'text', value: ', [документ](https://example.com)' },
    ]);
  });
});
