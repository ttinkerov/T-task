'use client';

import { useEffect } from 'react';
import { useCreateTaskShortcutListener } from '@/features/shell/hooks/use-shortcut-handlers';
import type { BoardViewMode } from '../../../lib/task-view-utils';

const FOCUS_CREATE_KEY = 'ttask:focus-create';

export function focusCreateTaskInput() {
  const input = document.querySelector<HTMLInputElement>('.kanban-column__add-input');
  input?.focus();
  input?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

export function useFocusCreateTaskInput(viewMode: BoardViewMode, boardId: string | null) {
  useCreateTaskShortcutListener(() => {
    if (viewMode !== 'BOARD') return;
    focusCreateTaskInput();
  });

  useEffect(() => {
    if (viewMode !== 'BOARD' || !boardId) return;
    try {
      if (window.sessionStorage.getItem(FOCUS_CREATE_KEY) !== '1') return;
      window.sessionStorage.removeItem(FOCUS_CREATE_KEY);
      window.requestAnimationFrame(() => focusCreateTaskInput());
    } catch {
      // ignore
    }
  }, [boardId, viewMode]);
}
