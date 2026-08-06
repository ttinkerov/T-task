'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import { fetchBoardTemplates, type BoardTemplate } from '@/features/workspace-tools/api';
import BoardSwitcherView from '@/vue/boards/BoardSwitcher.vue';
import {
  useBoardsQuery,
  useCreateBoardMutation,
  useDeleteBoardMutation,
  useUpdateBoardMutation,
} from '../hooks';
import type { BoardSummary } from '../types';

const selectedBoardStorageKey = (workspaceId: string) => `board:selected:${workspaceId}`;
const EMPTY_BOARDS: BoardSummary[] = [];

export function readStoredBoardId(workspaceId: string): string | null {
  try {
    return window.localStorage.getItem(selectedBoardStorageKey(workspaceId));
  } catch {
    return null;
  }
}

export function storeSelectedBoardId(workspaceId: string, boardId: string) {
  try {
    window.localStorage.setItem(selectedBoardStorageKey(workspaceId), boardId);
  } catch (error) {
    console.warn('Не удалось сохранить выбранную доску', error);
  }
}

interface BoardSwitcherProps {
  workspaceId: string;
  boardId: string | null;
  preferredBoardId?: string | null;
  onBoardChange: (boardId: string) => void;
}

export function BoardSwitcher({
  workspaceId,
  boardId,
  preferredBoardId = null,
  onBoardChange,
}: BoardSwitcherProps) {
  const { data, isLoading } = useBoardsQuery(workspaceId);
  const boards = data ?? EMPTY_BOARDS;
  const createMutation = useCreateBoardMutation(workspaceId);
  const updateMutation = useUpdateBoardMutation(workspaceId);
  const deleteMutation = useDeleteBoardMutation(workspaceId);
  const [templates, setTemplates] = useState<BoardTemplate[]>([]);

  useEffect(() => {
    if (!boards.length) return;
    const preferred =
      preferredBoardId && boards.some((board) => board.id === preferredBoardId)
        ? preferredBoardId
        : null;
    const stored = readStoredBoardId(workspaceId);
    const storedExists = Boolean(stored && boards.some((board) => board.id === stored));
    const nextId = preferred ?? (storedExists ? stored! : boards[0].id);
    if (boardId !== nextId) {
      onBoardChange(nextId);
    }
  }, [boardId, boards, onBoardChange, preferredBoardId, workspaceId]);

  const onRequestTemplates = useCallback(() => {
    void fetchBoardTemplates(workspaceId)
      .then((response) => setTemplates(response.data ?? []))
      .catch(() => setTemplates([]));
  }, [workspaceId]);

  const onCreate = useCallback(
    async (name: string, templateId: string) => {
      const created = await createMutation.mutateAsync({ name, templateId });
      if (created?.id) onBoardChange(created.id);
    },
    [createMutation, onBoardChange],
  );

  const onRename = useCallback(
    async (name: string) => {
      if (!boardId) return;
      await updateMutation.mutateAsync({ boardId, name });
    },
    [boardId, updateMutation],
  );

  const onDelete = useCallback(async () => {
    if (!boardId || boards.length <= 1) return;
    if (!window.confirm('Удалить эту доску? Задачи на ней будут удалены.')) return;
    const remaining = boards.filter((board) => board.id !== boardId);
    await deleteMutation.mutateAsync(boardId);
    if (remaining[0]) onBoardChange(remaining[0].id);
  }, [boardId, boards, deleteMutation, onBoardChange]);

  const error =
    createMutation.error?.message ??
    updateMutation.error?.message ??
    deleteMutation.error?.message ??
    '';

  const viewProps = useMemo(
    () => ({
      boards,
      boardId: boardId ?? '',
      isLoading,
      templates,
      createPending: createMutation.isPending,
      updatePending: updateMutation.isPending,
      deletePending: deleteMutation.isPending,
      error,
      onBoardChange,
      onCreate,
      onRename,
      onDelete,
      onRequestTemplates,
    }),
    [
      boards,
      boardId,
      isLoading,
      templates,
      createMutation.isPending,
      updateMutation.isPending,
      deleteMutation.isPending,
      error,
      onBoardChange,
      onCreate,
      onRename,
      onDelete,
      onRequestTemplates,
    ],
  );

  return <VueIsland component={BoardSwitcherView} componentProps={viewProps} />;
}
