import { describe, expect, it } from 'vitest';
import { isEditableTarget, matchShortcut } from './shortcuts';

describe('shortcut helpers', () => {
  it('matches plain keys without modifiers', () => {
    expect(
      matchShortcut(
        { key: 'c', metaKey: false, ctrlKey: false, altKey: false, shiftKey: false },
        'c',
      ),
    ).toBe(true);
    expect(
      matchShortcut(
        { key: '?', metaKey: false, ctrlKey: false, altKey: false, shiftKey: true },
        '?',
      ),
    ).toBe(true);
    expect(
      matchShortcut(
        { key: 'c', metaKey: true, ctrlKey: false, altKey: false, shiftKey: false },
        'c',
      ),
    ).toBe(false);
  });

  it('detects editable targets', () => {
    const input = { tagName: 'INPUT', isContentEditable: false, closest: () => null };
    const div = {
      tagName: 'DIV',
      isContentEditable: false,
      closest: (selector: string) => (selector.includes('input') ? null : null),
    };
    const editable = { tagName: 'DIV', isContentEditable: true, closest: () => null };

    expect(isEditableTarget(input as never)).toBe(true);
    expect(isEditableTarget(editable as never)).toBe(true);
    expect(isEditableTarget(div as never)).toBe(false);
    expect(isEditableTarget(null)).toBe(false);
  });
});
