import { describe, expect, it } from 'vitest';
import { toggleTaskSelection } from './bulk-selection';

describe('toggleTaskSelection', () => {
  const ordered = ['a', 'b', 'c', 'd'];

  it('selects a single task by default', () => {
    const result = toggleTaskSelection(new Set(), 'b', ordered);
    expect([...result.next]).toEqual(['b']);
    expect(result.anchorId).toBe('b');
  });

  it('toggles additively with modifier', () => {
    const first = toggleTaskSelection(new Set(['a']), 'c', ordered, { additive: true });
    expect([...first.next].sort()).toEqual(['a', 'c']);
    const second = toggleTaskSelection(first.next, 'a', ordered, { additive: true });
    expect([...second.next]).toEqual(['c']);
  });

  it('selects a range from the anchor with shift', () => {
    const result = toggleTaskSelection(new Set(['b']), 'd', ordered, {
      range: true,
      anchorId: 'b',
    });
    expect([...result.next]).toEqual(['b', 'c', 'd']);
  });
});
