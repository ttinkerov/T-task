'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  useBoardsQuery,
  useCreateBoardMutation,
  useDeleteBoardMutation,
  useUpdateBoardMutation,
} from '../hooks';

const selectedBoardStorageKey = (workspaceId: string) => `board:selected:${workspaceId}`;

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
  onBoardChange: (boardId: string) => void;
}

export function BoardSwitcher({ workspaceId, boardId, onBoardChange }: BoardSwitcherProps) {
  const { data: boards = [], isLoading } = useBoardsQuery(workspaceId);
  const createMutation = useCreateBoardMutation(workspaceId);
  const updateMutation = useUpdateBoardMutation(workspaceId);
  const deleteMutation = useDeleteBoardMutation(workspaceId);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  useEffect(() => {
    if (!boards.length) return;
    const stored = readStoredBoardId(workspaceId);
    const exists = stored && boards.some((board) => board.id === stored);
    const nextId = exists ? stored! : boards[0].id;
    if (boardId !== nextId) {
      onBoardChange(nextId);
    }
  }, [boardId, boards, onBoardChange, workspaceId]);

  const selected = boards.find((board) => board.id === boardId) ?? null;

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    const name = newName.trim() || 'Новая доска';
    const created = await createMutation.mutateAsync(name);
    setCreating(false);
    setNewName('');
    if (created?.id) onBoardChange(created.id);
  };

  const handleRename = async (event: FormEvent) => {
    event.preventDefault();
    if (!boardId || !renameValue.trim()) return;
    await updateMutation.mutateAsync({ boardId, name: renameValue.trim() });
    setRenaming(false);
  };

  const handleDelete = async () => {
    if (!boardId || boards.length <= 1) return;
    if (!window.confirm('Удалить эту доску? Задачи на ней будут удалены.')) return;
    const remaining = boards.filter((board) => board.id !== boardId);
    await deleteMutation.mutateAsync(boardId);
    if (remaining[0]) onBoardChange(remaining[0].id);
  };

  return (
    <div className="board-switcher">
      <select
        value={boardId ?? ''}
        onChange={(event) => onBoardChange(event.target.value)}
        className="board-filters__select"
        aria-label="Доска"
        disabled={isLoading || !boards.length}
      >
        {boards.map((board) => (
          <option key={board.id} value={board.id}>
            {board.name}
          </option>
        ))}
      </select>

      <button
        type="button"
        className="board-filters__chip"
        onClick={() => {
          setCreating(true);
          setRenaming(false);
        }}
      >
        Новая доска
      </button>

      {selected ? (
        <button
          type="button"
          className="board-filters__chip"
          onClick={() => {
            setRenaming(true);
            setCreating(false);
            setRenameValue(selected.name);
          }}
        >
          Переименовать
        </button>
      ) : null}

      {boards.length > 1 && boardId ? (
        <button
          type="button"
          className="board-filters__reset"
          disabled={deleteMutation.isPending}
          onClick={() => void handleDelete()}
        >
          Удалить
        </button>
      ) : null}

      {creating ? (
        <form className="board-switcher__form" onSubmit={(event) => void handleCreate(event)}>
          <input
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder="Название доски"
            maxLength={80}
            className="board-filters__search"
            aria-label="Название новой доски"
            autoFocus
          />
          <button
            type="submit"
            className="board-filters__chip board-filters__chip--active"
            disabled={createMutation.isPending}
          >
            Создать
          </button>
          <button type="button" className="board-filters__reset" onClick={() => setCreating(false)}>
            Отмена
          </button>
        </form>
      ) : null}

      {renaming ? (
        <form className="board-switcher__form" onSubmit={(event) => void handleRename(event)}>
          <input
            value={renameValue}
            onChange={(event) => setRenameValue(event.target.value)}
            placeholder="Название доски"
            maxLength={80}
            className="board-filters__search"
            aria-label="Новое название доски"
            autoFocus
          />
          <button
            type="submit"
            className="board-filters__chip board-filters__chip--active"
            disabled={!renameValue.trim() || updateMutation.isPending}
          >
            Сохранить
          </button>
          <button type="button" className="board-filters__reset" onClick={() => setRenaming(false)}>
            Отмена
          </button>
        </form>
      ) : null}

      {createMutation.error || updateMutation.error || deleteMutation.error ? (
        <p className="board-switcher__error" role="alert">
          {(createMutation.error ?? updateMutation.error ?? deleteMutation.error)?.message}
        </p>
      ) : null}
    </div>
  );
}
