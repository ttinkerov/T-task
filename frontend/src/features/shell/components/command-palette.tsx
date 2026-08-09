'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import { searchWorkspace } from '@/features/workspace-tools/api';
import CommandPaletteView from '@/vue/shell/CommandPalette.vue';

export interface CommandItem {
  id: string;
  label: string;
  hint?: string;
  href?: string;
  iconKey?: string;
  group: string;
  keywords?: string[];
  action?: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CommandItem[];
  workspaceId?: string | null;
}

export function CommandPalette({ open, onOpenChange, items, workspaceId }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [remoteItems, setRemoteItems] = useState<CommandItem[]>([]);

  const filteredNav = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const hay =
        `${item.label} ${item.hint ?? ''} ${(item.keywords ?? []).join(' ')}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, query]);

  const filtered = useMemo(() => [...remoteItems, ...filteredNav], [filteredNav, remoteItems]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setRemoteItems([]);
    setActiveIndex(0);
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, remoteItems]);

  useEffect(() => {
    const q = query.trim();
    if (!open || !workspaceId || q.length < 2) {
      setRemoteItems([]);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      void searchWorkspace(workspaceId, q)
        .then((response) => {
          if (cancelled || !response.data) return;
          const next: CommandItem[] = [
            ...response.data.tasks.map((task) => ({
              id: `task-${task.id}`,
              label: task.title,
              hint: task.matchIn === 'description' && task.snippet ? task.snippet : task.columnName,
              group: 'Задачи',
              href: task.href,
              iconKey: 'kanban',
            })),
            ...response.data.deals.map((deal) => ({
              id: `deal-${deal.id}`,
              label: deal.title,
              group: 'Сделки',
              href: deal.href,
              iconKey: 'handshake',
            })),
            ...response.data.comments.map((comment) => ({
              id: `comment-${comment.id}`,
              label: comment.preview,
              hint: comment.taskTitle,
              group: 'Комментарии',
              href: comment.href,
              iconKey: 'message',
            })),
          ];
          setRemoteItems(next);
        })
        .catch(() => {
          if (!cancelled) setRemoteItems([]);
        });
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, query, workspaceId]);

  const runItem = useCallback(
    (item: CommandItem) => {
      onOpenChange(false);
      if (item.action) item.action();
      else if (item.href) router.push(item.href);
    },
    [onOpenChange, router],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onOpenChange(false);
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      }
      if (event.key === 'Enter' && filtered[activeIndex]) {
        event.preventDefault();
        runItem(filtered[activeIndex]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, filtered, activeIndex, onOpenChange, runItem]);

  const groups = useMemo(() => {
    const map = new Map<string, Array<CommandItem & { index: number }>>();
    let flatIndex = -1;
    for (const item of filtered) {
      flatIndex += 1;
      const list = map.get(item.group) ?? [];
      list.push({ ...item, index: flatIndex });
      map.set(item.group, list);
    }
    return [...map.entries()].map(([name, groupItems]) => ({
      name,
      items: groupItems.map((item) => ({
        id: item.id,
        label: item.label,
        hint: item.hint,
        iconKey: item.iconKey ?? 'layout',
        index: item.index,
      })),
    }));
  }, [filtered]);

  const onSelect = useCallback(
    (itemId: string) => {
      const item = filtered.find((entry) => entry.id === itemId);
      if (item) runItem(item);
    },
    [filtered, runItem],
  );

  const viewProps = useMemo(
    () => ({
      open,
      query,
      groups,
      activeIndex,
      onClose: () => onOpenChange(false),
      onQueryChange: setQuery,
      onActiveChange: setActiveIndex,
      onSelect,
    }),
    [open, query, groups, activeIndex, onOpenChange, onSelect],
  );

  if (!open) return null;

  return <VueIsland component={CommandPaletteView} componentProps={viewProps} />;
}
