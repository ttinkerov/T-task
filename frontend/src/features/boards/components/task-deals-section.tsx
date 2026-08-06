'use client';

import { useCallback, useMemo, useState } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import { formatDealAmount } from '@/features/crm/types';
import {
  useFunnelsQuery,
  useFunnelQuery,
  useLinkTaskDealMutation,
  useTaskDealsQuery,
  useUnlinkTaskDealMutation,
} from '@/features/crm/hooks';
import TaskDealsSectionView from '@/vue/boards/TaskDealsSection.vue';

export function TaskDealsSection({ workspaceId, taskId }: { workspaceId: string; taskId: string }) {
  const { data: links = [], isLoading } = useTaskDealsQuery(workspaceId, taskId);
  const { data: funnels = [] } = useFunnelsQuery(workspaceId);
  const [funnelId, setFunnelId] = useState('');
  const funnelQuery = useFunnelQuery(workspaceId, funnelId || null);
  const linkMutation = useLinkTaskDealMutation(workspaceId, taskId);
  const unlinkMutation = useUnlinkTaskDealMutation(workspaceId, taskId);

  const linkedIds = useMemo(() => new Set(links.map((link) => link.dealId)), [links]);

  const dealOptions = useMemo(() => {
    if (!funnelQuery.data) return [];
    return funnelQuery.data.stages.flatMap((stage) =>
      stage.deals
        .filter((deal) => !linkedIds.has(deal.id))
        .map((deal) => ({
          id: deal.id,
          label: `${deal.title} · ${stage.name}`,
        })),
    );
  }, [funnelQuery.data, linkedIds]);

  const linkRows = useMemo(
    () =>
      links.map((link) => {
        const amount = formatDealAmount(link.deal.amount);
        return {
          dealId: link.dealId,
          title: link.deal.title,
          meta: amount ? `${link.deal.stageName} · ${amount}` : link.deal.stageName,
        };
      }),
    [links],
  );

  const onFunnelSelect = useCallback((nextFunnelId: string) => {
    setFunnelId(nextFunnelId);
  }, []);

  const onLink = useCallback((dealId: string) => linkMutation.mutateAsync(dealId), [linkMutation]);

  const onUnlink = useCallback(
    (dealId: string) => {
      unlinkMutation.mutate(dealId);
    },
    [unlinkMutation],
  );

  const viewProps = useMemo(
    () => ({
      links: linkRows,
      funnels,
      dealOptions,
      funnelId,
      isLoading,
      linkPending: linkMutation.isPending,
      unlinkPending: unlinkMutation.isPending,
      error: (linkMutation.error ?? unlinkMutation.error)?.message ?? '',
      onFunnelSelect,
      onLink,
      onUnlink,
    }),
    [
      linkRows,
      funnels,
      dealOptions,
      funnelId,
      isLoading,
      linkMutation.isPending,
      linkMutation.error,
      unlinkMutation.isPending,
      unlinkMutation.error,
      onFunnelSelect,
      onLink,
      onUnlink,
    ],
  );

  return <VueIsland component={TaskDealsSectionView} componentProps={viewProps} />;
}
