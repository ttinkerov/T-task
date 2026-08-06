'use client';

import { useMemo } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import DealDrawerHeaderView from '@/vue/crm/DealDrawerHeader.vue';

export function DealDrawerHeader({
  stageName,
  onClose,
}: {
  stageName: string;
  onClose: () => void;
}) {
  const viewProps = useMemo(
    () => ({
      stageName,
      onClose,
    }),
    [stageName, onClose],
  );

  return <VueIsland component={DealDrawerHeaderView} componentProps={viewProps} />;
}
