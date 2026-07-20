'use client';

import { cn } from '@/shared/lib/cn';

interface SkeletonProps {
  className?: string;
  variant?: 'card' | 'line' | 'title';
}

export function Skeleton({ className, variant = 'line' }: SkeletonProps) {
  return (
    <div className={cn('tt-skeleton', `tt-skeleton--${variant}`, className)} aria-hidden="true" />
  );
}

export function BoardSkeleton() {
  return (
    <div className="flex gap-3 overflow-hidden" role="status" aria-label="Загрузка доски">
      {Array.from({ length: 3 }).map((_, column) => (
        <div
          key={column}
          className="flex w-[300px] shrink-0 flex-col gap-2 rounded-xl border border-[var(--tt-border-subtle)] bg-[var(--tt-surface)] p-3"
        >
          <Skeleton variant="title" />
          <Skeleton variant="card" />
          <Skeleton variant="card" />
          <Skeleton variant="card" className="h-16" />
        </div>
      ))}
    </div>
  );
}
