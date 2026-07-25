'use client';

import { FormEvent, useState } from 'react';
import { useCreateColumnMutation } from '../../hooks';

export function AddColumnPanel({ workspaceId, boardId }: { workspaceId: string; boardId: string }) {
  const createColumnMutation = useCreateColumnMutation(workspaceId, boardId);
  const [name, setName] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return;
    await createColumnMutation.mutateAsync(name.trim());
    setName('');
  };

  return (
    <form onSubmit={handleSubmit} className="kanban-add-column">
      <span className="kanban-add-column__label">Новая колонка</span>
      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Название колонки"
        maxLength={80}
        className="kanban-add-column__input"
      />
      <button
        type="submit"
        disabled={!name.trim() || createColumnMutation.isPending}
        className="kanban-add-column__btn"
      >
        {createColumnMutation.isPending ? 'Добавление...' : '+ Добавить колонку'}
      </button>
    </form>
  );
}
