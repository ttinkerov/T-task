'use client';

import { useState } from 'react';
import {
  useAiSettingsQuery,
  useApplyEpicBreakdownMutation,
  useProposeEpicBreakdownMutation,
} from '../hooks';
import type { EpicBreakdownDraft } from '../types';

export function EpicAiBreakdown({
  workspaceId,
  epicId,
  onApplied,
}: {
  workspaceId: string;
  epicId: string;
  onApplied?: () => void;
}) {
  const { data: settings } = useAiSettingsQuery(workspaceId);
  const proposeMutation = useProposeEpicBreakdownMutation(workspaceId, epicId);
  const applyMutation = useApplyEpicBreakdownMutation(workspaceId, epicId);

  const [open, setOpen] = useState(false);
  const [instructions, setInstructions] = useState('');
  const [drafts, setDrafts] = useState<EpicBreakdownDraft[]>([]);
  const [model, setModel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!settings?.configured) {
    return null;
  }

  const handlePropose = async () => {
    setError(null);
    setSuccessMessage(null);
    try {
      const result = await proposeMutation.mutateAsync({
        instructions: instructions.trim() || undefined,
      });
      setDrafts(result.tasks);
      setModel(result.model);
      setOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось разбить эпик');
    }
  };

  const updateDraft = (index: number, patch: Partial<EpicBreakdownDraft>) => {
    setDrafts((current) =>
      current.map((draft, draftIndex) => (draftIndex === index ? { ...draft, ...patch } : draft)),
    );
  };

  const removeDraft = (index: number) => {
    setDrafts((current) => current.filter((_, draftIndex) => draftIndex !== index));
  };

  const handleApply = async () => {
    const tasks = drafts
      .map((draft) => ({
        title: draft.title.trim(),
        description: draft.description.trim(),
      }))
      .filter((draft) => draft.title.length > 0);

    if (tasks.length === 0) {
      setError('Добавьте хотя бы одну задачу с названием');
      return;
    }

    setError(null);
    try {
      const result = await applyMutation.mutateAsync({ tasks });
      setSuccessMessage(`Создано задач: ${result.createdCount}`);
      setDrafts([]);
      setOpen(false);
      onApplied?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось создать задачи');
    }
  };

  return (
    <div className="epic-ai">
      <div className="epic-ai__actions">
        <button
          type="button"
          className="btn-ghost"
          disabled={proposeMutation.isPending}
          onClick={() => void handlePropose()}
        >
          {proposeMutation.isPending ? 'Думаем…' : 'Разбей эпик с ИИ'}
        </button>
      </div>

      {error ? <p className="epic-ai__error">{error}</p> : null}
      {successMessage ? <p className="epic-ai__success">{successMessage}</p> : null}

      {open ? (
        <div className="epic-ai__panel">
          <label className="epic-ai__field">
            <span>Уточнения (опционально)</span>
            <input
              className="glass-input"
              value={instructions}
              onChange={(event) => setInstructions(event.target.value)}
              maxLength={500}
              placeholder="Например: больше внимания API и тестам"
            />
          </label>

          <ul className="epic-ai__list">
            {drafts.map((draft, index) => (
              <li key={`${index}-${draft.title}`}>
                <input
                  className="glass-input"
                  value={draft.title}
                  onChange={(event) => updateDraft(index, { title: event.target.value })}
                  maxLength={200}
                  placeholder="Название задачи"
                />
                <textarea
                  className="glass-input"
                  value={draft.description}
                  onChange={(event) => updateDraft(index, { description: event.target.value })}
                  maxLength={2000}
                  rows={2}
                  placeholder="Описание"
                />
                <button type="button" className="btn-ghost" onClick={() => removeDraft(index)}>
                  Убрать
                </button>
              </li>
            ))}
          </ul>

          <div className="epic-ai__footer">
            <button
              type="button"
              className="btn-primary"
              disabled={applyMutation.isPending || drafts.length === 0}
              onClick={() => void handleApply()}
            >
              {applyMutation.isPending ? 'Создаём…' : `Создать ${drafts.length} задач на доске`}
            </button>
            {model ? <span className="epic-ai__meta">{model}</span> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
