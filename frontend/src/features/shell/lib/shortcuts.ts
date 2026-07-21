export type ShortcutId = 'create-task' | 'assign-me' | 'focus-comment' | 'shortcuts-help';

export type ShortcutDefinition = {
  id: ShortcutId;
  key: string;
  label: string;
  description: string;
  scope: 'global' | 'task';
};

export const SHORTCUTS: ShortcutDefinition[] = [
  {
    id: 'create-task',
    key: 'c',
    label: 'C',
    description: 'Создать задачу',
    scope: 'global',
  },
  {
    id: 'assign-me',
    key: 'm',
    label: 'M',
    description: 'Назначить на меня',
    scope: 'task',
  },
  {
    id: 'focus-comment',
    key: '/',
    label: '/',
    description: 'Комментарий',
    scope: 'task',
  },
  {
    id: 'shortcuts-help',
    key: '?',
    label: '?',
    description: 'Список шорткатов',
    scope: 'global',
  },
];

export function isEditableTarget(target: EventTarget | null): boolean {
  if (!target || typeof target !== 'object') return false;

  const element = target as {
    isContentEditable?: boolean;
    tagName?: string;
    closest?: (selectors: string) => Element | null;
  };

  if (element.isContentEditable) return true;

  const tag = element.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;

  if (typeof element.closest === 'function') {
    return Boolean(element.closest('input, textarea, select, [contenteditable="true"]'));
  }

  return false;
}

export function matchShortcut(
  event: Pick<KeyboardEvent, 'key' | 'metaKey' | 'ctrlKey' | 'altKey' | 'shiftKey'>,
  shortcutKey: string,
): boolean {
  if (event.metaKey || event.ctrlKey || event.altKey) return false;
  return event.key === shortcutKey;
}

export const SHORTCUT_EVENT = 'ttask:shortcut';

export type ShortcutEventDetail = { action: ShortcutId };

export function dispatchShortcut(action: ShortcutId) {
  window.dispatchEvent(
    new CustomEvent<ShortcutEventDetail>(SHORTCUT_EVENT, { detail: { action } }),
  );
}
