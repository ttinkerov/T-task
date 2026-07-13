'use client';

import { FormEvent, useState } from 'react';
import { useCreateWorkspaceMutation } from '../hooks';

export function CreateWorkspaceForm() {
  const [name, setName] = useState('');
  const createMutation = useCreateWorkspaceMutation();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await createMutation.mutateAsync(name);
    setName('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-2">
      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Название новой команды"
        required
        className="glass-input min-w-[220px] flex-1"
      />
      <button type="submit" disabled={createMutation.isPending} className="btn-ghost">
        Создать команду
      </button>
    </form>
  );
}
