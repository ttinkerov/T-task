'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toggleTaskSelection } from '../../../lib/bulk-selection';
import type { BoardViewMode } from '../../../lib/task-view-utils';

export function useBoardBulkSelection(
  orderedTaskIds: string[],
  boardId: string | null,
  viewMode: BoardViewMode,
) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const bulkAnchorIdRef = useRef<string | null>(null);

  useEffect(() => {
    setSelectedIds(new Set());
    bulkAnchorIdRef.current = null;
  }, [boardId, viewMode]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedIds(new Set());
        bulkAnchorIdRef.current = null;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const toggleSelect = useCallback(
    (taskId: string, event: { shiftKey: boolean; metaKey: boolean; ctrlKey: boolean }) => {
      const result = toggleTaskSelection(selectedIds, taskId, orderedTaskIds, {
        additive: event.metaKey || event.ctrlKey,
        range: event.shiftKey,
        anchorId: bulkAnchorIdRef.current,
      });
      setSelectedIds(result.next);
      bulkAnchorIdRef.current = result.anchorId;
    },
    [selectedIds, orderedTaskIds],
  );

  const clear = useCallback(() => {
    setSelectedIds(new Set());
    bulkAnchorIdRef.current = null;
  }, []);

  return { selectedIds, toggleSelect, clear };
}
