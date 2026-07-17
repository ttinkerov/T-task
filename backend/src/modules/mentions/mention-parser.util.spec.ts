import { describe, expect, it } from 'vitest';
import { extractMentionUserIds, sanitizeMentionLabels } from './mention-parser.util';

describe('mention parser', () => {
  it('extracts unique user ids from structured mentions', () => {
    const body =
      'Проверь, @[Анна Иванова](cm12345678901234567890) и @[Иван](cm09876543210987654321). ' +
      'Ещё раз @[Анна](cm12345678901234567890).';

    expect(extractMentionUserIds(body)).toEqual([
      'cm12345678901234567890',
      'cm09876543210987654321',
    ]);
  });

  it('ignores malformed mentions, URLs, and arbitrary markdown links', () => {
    const body =
      '@Анна https://example.com/@user [Документ](cm12345678901234567890) ' +
      '@[Без id]() @[Короткий](abc)';

    expect(extractMentionUserIds(body)).toEqual([]);
  });

  it('normalizes labels without changing ids or surrounding text', () => {
    const body = 'Привет, @[Старое имя](cm12345678901234567890)!';

    expect(sanitizeMentionLabels(body, new Map([['cm12345678901234567890', 'Анна Иванова']]))).toBe(
      'Привет, @[Анна Иванова](cm12345678901234567890)!',
    );
  });

  it('escapes mention label delimiters', () => {
    const body = '@[Old](cm12345678901234567890)';

    expect(
      sanitizeMentionLabels(body, new Map([['cm12345678901234567890', 'Анна [QA] (Lead)']])),
    ).toBe('@[Анна QA Lead](cm12345678901234567890)');
  });
});
