'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Handshake,
  LayoutDashboard,
  MessageSquareText,
  Search,
  SquareKanban,
  type LucideIcon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { searchWorkspace } from '@/features/workspace-tools/api';

export interface CommandItem {
  id: string;
  label: string;
  hint?: string;
  href?: string;
  icon?: LucideIcon;
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
  const inputRef = useRef<HTMLInputElement>(null);
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
    const id = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(id);
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
              icon: SquareKanban,
            })),
            ...response.data.deals.map((deal) => ({
              id: `deal-${deal.id}`,
              label: deal.title,
              group: 'Сделки',
              href: deal.href,
              icon: Handshake,
            })),
            ...response.data.comments.map((comment) => ({
              id: `comment-${comment.id}`,
              label: comment.preview,
              hint: comment.taskTitle,
              group: 'Комментарии',
              href: comment.href,
              icon: MessageSquareText,
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
    const map = new Map<string, CommandItem[]>();
    for (const item of filtered) {
      const list = map.get(item.group) ?? [];
      list.push(item);
      map.set(item.group, list);
    }
    return [...map.entries()];
  }, [filtered]);

  let flatIndex = -1;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="cmdk-overlay"
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          onClick={() => onOpenChange(false)}
        >
          <motion.div
            className="cmdk"
            role="dialog"
            aria-modal="true"
            aria-label="Быстрый переход"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="cmdk__search">
              <Search size={16} strokeWidth={1.75} aria-hidden="true" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Найти задачу, сделку или страницу…"
                aria-label="Быстрый переход"
              />
              <kbd>esc</kbd>
            </div>

            <div className="cmdk__list" role="listbox">
              {filtered.length === 0 ? (
                <p className="cmdk__empty">Ничего не найдено</p>
              ) : (
                groups.map(([group, groupItems]) => (
                  <div key={group} className="cmdk__group">
                    <p className="cmdk__group-label">{group}</p>
                    {groupItems.map((item) => {
                      flatIndex += 1;
                      const index = flatIndex;
                      const Icon = item.icon ?? LayoutDashboard;
                      const active = index === activeIndex;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          role="option"
                          aria-selected={active}
                          className={`cmdk__item${active ? ' cmdk__item--active' : ''}`}
                          onMouseEnter={() => setActiveIndex(index)}
                          onClick={() => runItem(item)}
                        >
                          <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
                          <span className="cmdk__item-label">
                            <span>{item.label}</span>
                            {item.hint ? (
                              <small className="cmdk__item-hint">{item.hint}</small>
                            ) : null}
                          </span>
                          <ArrowRight size={14} className="cmdk__item-arrow" aria-hidden="true" />
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            <footer className="cmdk__footer">
              <span>
                <kbd>↑↓</kbd> навигация
              </span>
              <span>
                <kbd>↵</kbd> открыть
              </span>
              <span>
                <kbd>esc</kbd> закрыть
              </span>
            </footer>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
