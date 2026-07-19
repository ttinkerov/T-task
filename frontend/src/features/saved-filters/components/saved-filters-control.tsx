'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { EMPTY_BOARD_FILTERS, type BoardFilters } from '@/features/boards/types';
import {
  useCreateSavedFilterMutation,
  useDeleteSavedFilterMutation,
  useSavedFiltersQuery,
  useUpdateSavedFilterMutation,
} from '../hooks';
import type { SavedFilter, SavedFilterView } from '../types';

interface SavedFiltersControlProps {
  workspaceId: string;
  view: SavedFilterView;
  filters: BoardFilters;
  onApply: (filters: BoardFilters) => void;
  /** When true, skip applying the default filter on load (e.g. already applied). */
  skipDefaultApply?: boolean;
}

export function SavedFiltersControl({
  workspaceId,
  view,
  filters,
  onApply,
  skipDefaultApply = false,
}: SavedFiltersControlProps) {
  const { data: saved = [], isLoading } = useSavedFiltersQuery(workspaceId, view);
  const createMutation = useCreateSavedFilterMutation(workspaceId, view);
  const updateMutation = useUpdateSavedFilterMutation(workspaceId, view);
  const deleteMutation = useDeleteSavedFilterMutation(workspaceId, view);

  const [selectedId, setSelectedId] = useState('');
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const appliedDefaultRef = useRef(false);

  useEffect(() => {
    appliedDefaultRef.current = false;
    setSelectedId('');
  }, [workspaceId, view]);

  useEffect(() => {
    if (skipDefaultApply || appliedDefaultRef.current || isLoading || !saved.length) return;
    const defaultFilter = saved.find((item) => item.isDefault);
    if (!defaultFilter) return;
    appliedDefaultRef.current = true;
    setSelectedId(defaultFilter.id);
    onApply(normalizeFilters(defaultFilter.filters));
  }, [isLoading, onApply, saved, skipDefaultApply]);

  const handleSelect = (filterId: string) => {
    setSelectedId(filterId);
    if (!filterId) return;
    const found = saved.find((item) => item.id === filterId);
    if (found) onApply(normalizeFilters(found.filters));
  };

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    const name = saveName.trim();
    if (!name) return;

    const created = await createMutation.mutateAsync({
      view,
      name,
      filters,
      isDefault: saveAsDefault,
    });
    setSaveOpen(false);
    setSaveName('');
    setSaveAsDefault(false);
    if (created?.id) setSelectedId(created.id);
  };

  const selected = saved.find((item) => item.id === selectedId) ?? null;

  return (
    <div className="saved-filters">
      <select
        value={selectedId}
        onChange={(event) => handleSelect(event.target.value)}
        className="board-filters__select"
        aria-label="Сохранённые фильтры"
        disabled={isLoading}
      >
        <option value="">Сохранённые фильтры</option>
        {saved.map((item) => (
          <option key={item.id} value={item.id}>
            {item.isDefault ? `★ ${item.name}` : item.name}
          </option>
        ))}
      </select>

      <button
        type="button"
        className="board-filters__chip"
        onClick={() => setSaveOpen((open) => !open)}
      >
        Сохранить фильтр
      </button>

      {selected ? (
        <>
          {!selected.isDefault ? (
            <button
              type="button"
              className="board-filters__chip"
              disabled={updateMutation.isPending}
              onClick={() =>
                updateMutation.mutate({ filterId: selected.id, data: { isDefault: true } })
              }
            >
              По умолчанию
            </button>
          ) : null}
          <button
            type="button"
            className="board-filters__reset"
            disabled={deleteMutation.isPending}
            onClick={() => {
              deleteMutation.mutate(selected.id, {
                onSuccess: () => {
                  setSelectedId('');
                  onApply(EMPTY_BOARD_FILTERS);
                },
              });
            }}
            aria-label={`Удалить фильтр ${selected.name}`}
          >
            Удалить
          </button>
        </>
      ) : null}

      {saveOpen ? (
        <form className="saved-filters__form" onSubmit={(event) => void handleSave(event)}>
          <input
            value={saveName}
            onChange={(event) => setSaveName(event.target.value)}
            placeholder="Название фильтра"
            maxLength={80}
            className="board-filters__search"
            aria-label="Название сохранённого фильтра"
            autoFocus
          />
          <label className="saved-filters__default">
            <input
              type="checkbox"
              checked={saveAsDefault}
              onChange={(event) => setSaveAsDefault(event.target.checked)}
            />
            По умолчанию
          </label>
          <button
            type="submit"
            className="board-filters__chip board-filters__chip--active"
            disabled={!saveName.trim() || createMutation.isPending}
          >
            {createMutation.isPending ? 'Сохранение…' : 'Сохранить'}
          </button>
          <button type="button" className="board-filters__reset" onClick={() => setSaveOpen(false)}>
            Отмена
          </button>
        </form>
      ) : null}

      {createMutation.error || updateMutation.error || deleteMutation.error ? (
        <p className="saved-filters__error" role="alert">
          {(createMutation.error ?? updateMutation.error ?? deleteMutation.error)?.message ??
            'Не удалось обновить фильтр'}
        </p>
      ) : null}
    </div>
  );
}

function normalizeFilters(raw: SavedFilter['filters'] | Record<string, unknown>): BoardFilters {
  const source = raw ?? {};
  return {
    search: typeof source.search === 'string' ? source.search : '',
    priority:
      source.priority === 'LOW' ||
      source.priority === 'MEDIUM' ||
      source.priority === 'HIGH' ||
      source.priority === 'URGENT'
        ? source.priority
        : '',
    assigneeId: typeof source.assigneeId === 'string' ? source.assigneeId : '',
    tagId: typeof source.tagId === 'string' ? source.tagId : '',
    myTasksOnly: Boolean(source.myTasksOnly),
    overdueStatus:
      source.overdueStatus === 'overdue' || source.overdueStatus === 'not_overdue'
        ? source.overdueStatus
        : '',
  };
}
