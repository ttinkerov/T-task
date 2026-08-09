'use client';

import { useMemo } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import SkeletonView from '@/vue/ui/Skeleton.vue';

export function Skeleton({
  className,
  variant = 'line',
}: {
  className?: string;
  variant?: 'card' | 'line' | 'title';
}) {
  const viewProps = useMemo(
    () => ({
      variant,
      className: className ?? '',
    }),
    [variant, className],
  );

  return <VueIsland component={SkeletonView} componentProps={viewProps} />;
}

export function BoardSkeleton() {
  const viewProps = useMemo(() => ({ variant: '', className: '' }), []);
  return <VueIsland component={SkeletonView} componentProps={viewProps} />;
}
