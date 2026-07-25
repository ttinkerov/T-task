import { describe, expect, it } from 'vitest';
import { formatCustomFieldValue, toPlainMentionText } from './task-card-format';
import type { CustomFieldDefinition } from '@/features/custom-fields/types';

describe('formatCustomFieldValue', () => {
  const names = new Map([['u1', 'Ada']]);

  it('formats checkbox true', () => {
    const field = { id: 'f1', name: 'Done', type: 'CHECKBOX' } as CustomFieldDefinition;
    expect(formatCustomFieldValue(field, true, names)).toBe('Done: да');
    expect(formatCustomFieldValue(field, false, names)).toBeNull();
  });

  it('formats user', () => {
    const field = { id: 'f1', name: 'Owner', type: 'USER' } as CustomFieldDefinition;
    expect(formatCustomFieldValue(field, 'u1', names)).toBe('Owner: Ada');
  });
});

describe('toPlainMentionText', () => {
  it('replaces mentions with names', () => {
    const names = new Map([['cm12345678901234567890', 'Анна']]);
    expect(toPlainMentionText('Hi @[Анна](cm12345678901234567890)!', names)).toBe('Hi @Анна!');
  });

  it('renders wiki-links as readable titles', () => {
    const names = new Map<string, string>();
    expect(toPlainMentionText('См. [[Онбординг]](cm12345678901234567890)', names)).toBe(
      'См. [[Онбординг]]',
    );
  });
});
