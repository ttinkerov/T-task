'use client';

import { useMemo } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import BoardEmptyStateView from '@/vue/boards/BoardEmptyState.vue';

export function BoardEmptyState({
  icon = '',
  title,
  description,
  actionLabel,
  onAction,
  actionPending = false,
  actionDisabled = false,
  className = '',
}: {
  icon?: 'kanban' | 'layout-list' | 'plus' | 'clipboard-list' | '';
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  actionPending?: boolean;
  actionDisabled?: boolean;
  className?: string;
}) {
  const viewProps = useMemo(
    () => ({
      icon,
      title,
      description,
      actionLabel,
      actionPending,
      actionDisabled,
      className,
      onAction,
    }),
    [icon, title, description, actionLabel, actionPending, actionDisabled, className, onAction],
  );

  return <VueIsland component={BoardEmptyStateView} componentProps={viewProps} />;
}
