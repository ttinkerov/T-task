'use client';

import { useEffect, useRef } from 'react';
import {
  dispatchShortcut,
  isEditableTarget,
  matchShortcut,
  type ShortcutId,
} from '../lib/shortcuts';

type ShortcutHandlerMap = Partial<Record<ShortcutId, () => void>>;

export function useShortcutHandlers(handlers: ShortcutHandlerMap, enabled = true) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return;

      const entries: Array<[ShortcutId, string]> = [
        ['create-task', 'c'],
        ['assign-me', 'm'],
        ['focus-comment', '/'],
        ['shortcuts-help', '?'],
      ];

      for (const [id, key] of entries) {
        if (!matchShortcut(event, key)) continue;
        const handler = handlersRef.current[id];
        if (!handler) continue;
        event.preventDefault();
        handler();
        return;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled]);
}

export function useCreateTaskShortcutListener(onCreate: () => void) {
  const onCreateRef = useRef(onCreate);
  onCreateRef.current = onCreate;

  useEffect(() => {
    const onShortcut = (event: Event) => {
      const detail = (event as CustomEvent<{ action: ShortcutId }>).detail;
      if (detail?.action === 'create-task') onCreateRef.current();
    };
    window.addEventListener('ttask:shortcut', onShortcut);
    return () => window.removeEventListener('ttask:shortcut', onShortcut);
  }, []);
}

export { dispatchShortcut };
