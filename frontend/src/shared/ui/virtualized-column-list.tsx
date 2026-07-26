'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import { type ReactNode, useRef } from 'react';

const ITEM_GAP_PX = 7;
const DEFAULT_ESTIMATE_PX = 96;

type VirtualizedColumnListProps<T> = {
  items: T[];
  getItemKey: (item: T, index: number) => string;
  estimateSize?: number;
  overscan?: number;
  className?: string;
  footer?: ReactNode;
  children: (item: T, index: number) => ReactNode;
};

export function VirtualizedColumnList<T>({
  items,
  getItemKey,
  estimateSize = DEFAULT_ESTIMATE_PX,
  overscan = 8,
  className = 'kanban-column__tasks',
  footer,
  children,
}: VirtualizedColumnListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
    gap: ITEM_GAP_PX,
    getItemKey: (index) => getItemKey(items[index]!, index),
  });

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div ref={parentRef} className={`${className} kanban-column__tasks--virtual`}>
      <div className="kanban-column__virtual-spacer" style={{ height: virtualizer.getTotalSize() }}>
        {virtualItems.map((virtualRow) => {
          const item = items[virtualRow.index];
          if (!item) return null;
          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              className="kanban-column__virtual-item"
              style={{
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {children(item, virtualRow.index)}
            </div>
          );
        })}
      </div>
      {footer}
    </div>
  );
}
