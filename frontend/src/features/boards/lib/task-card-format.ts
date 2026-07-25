import type { CustomFieldDefinition } from '@/features/custom-fields/types';
import { tokenizeMentions } from '../../mentions/mention-utils';
import type { BoardTask } from '../types';

export function formatCustomFieldValue(
  field: CustomFieldDefinition,
  value: BoardTask['customFields'][number]['value'],
  memberNames: Map<string, string>,
): string | null {
  if (value === null || value === undefined || value === '') return null;

  switch (field.type) {
    case 'CHECKBOX':
      return value === true ? `${field.name}: да` : null;
    case 'MULTI_SELECT': {
      if (!Array.isArray(value) || value.length === 0) return null;
      return `${field.name}: ${value.join(', ')}`;
    }
    case 'USER': {
      const name = typeof value === 'string' ? memberNames.get(value) : undefined;
      return name ? `${field.name}: ${name}` : null;
    }
    case 'DATE': {
      if (typeof value !== 'string') return null;
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return null;
      return `${field.name}: ${date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}`;
    }
    default:
      return `${field.name}: ${String(value)}`;
  }
}

export function toPlainMentionText(text: string, memberNames: Map<string, string>) {
  return tokenizeMentions(text)
    .map((token) =>
      token.type === 'text'
        ? token.value
        : `@${memberNames.get(token.userId) ?? token.value.slice(1)}`,
    )
    .join('');
}
