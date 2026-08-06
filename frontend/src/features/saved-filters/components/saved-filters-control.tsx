'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import { EMPTY_BOARD_FILTERS, type BoardFilters } from '@/features/boards/types';
import SavedFiltersControlView from '@/vue/boards/SavedFiltersControl.vue';
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

  const onSelect = useCallback(
    (filterId: string) => {
      setSelectedId(filterId);
      if (!filterId) return;
      const found = saved.find((item) => item.id === filterId);
      if (found) onApply(normalizeFilters(found.filters));
    },
    [onApply, saved],
  );

  const onSave = useCallback(
    async (payload: { name: string; isDefault: boolean; isShared: boolean }) => {
      const created = await createMutation.mutateAsync({
        view,
        name: payload.name,
        filters,
        isDefault: payload.isDefault,
        isShared: payload.isShared,
      });
      if (created?.id) setSelectedId(created.id);
    },
    [createMutation, filters, view],
  );

  const onSetDefault = useCallback(
    (filterId: string) => {
      updateMutation.mutate({ filterId, data: { isDefault: true } });
    },
    [updateMutation],
  );

  const onTogglePinned = useCallback(
    (filterId: string, isPinned: boolean) => {
      updateMutation.mutate({ filterId, data: { isPinned } });
    },
    [updateMutation],
  );

  const onToggleShared = useCallback(
    (filterId: string, isShared: boolean) => {
      updateMutation.mutate({ filterId, data: { isShared } });
    },
    [updateMutation],
  );

  const onDelete = useCallback(
    (filterId: string) => {
      deleteMutation.mutate(filterId, {
        onSuccess: () => {
          setSelectedId('');
          onApply(EMPTY_BOARD_FILTERS);
        },
      });
    },
    [deleteMutation, onApply],
  );

  const error =
    createMutation.error?.message ??
    updateMutation.error?.message ??
    deleteMutation.error?.message ??
    '';

  const viewProps = useMemo(
    () => ({
      saved,
      selectedId,
      isLoading,
      createPending: createMutation.isPending,
      updatePending: updateMutation.isPending,
      deletePending: deleteMutation.isPending,
      error,
      onSelect,
      onSave,
      onSetDefault,
      onTogglePinned,
      onToggleShared,
      onDelete,
    }),
    [
      saved,
      selectedId,
      isLoading,
      createMutation.isPending,
      updateMutation.isPending,
      deleteMutation.isPending,
      error,
      onSelect,
      onSave,
      onSetDefault,
      onTogglePinned,
      onToggleShared,
      onDelete,
    ],
  );

  return <VueIsland component={SavedFiltersControlView} componentProps={viewProps} />;
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
    sprintId: typeof source.sprintId === 'string' ? source.sprintId : '',
    epicId: typeof source.epicId === 'string' ? source.epicId : '',
  };
}
