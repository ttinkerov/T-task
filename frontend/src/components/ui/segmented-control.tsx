'use client';

import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { cn } from '@/shared/lib/cn';

export interface SegmentedOption<T extends string> {
  value: T;
  label: ReactNode;
  disabled?: boolean;
}

interface SegmentedControlProps<T extends string> {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: 'sm' | 'md';
  'aria-label'?: string;
}

interface PillMetrics {
  left: number;
  width: number;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
  size = 'md',
  'aria-label': ariaLabel,
}: SegmentedControlProps<T>) {
  const listRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef(new Map<T, HTMLButtonElement>());
  const [pill, setPill] = useState<PillMetrics>({ left: 2, width: 0 });
  const optionsKey = options.map((option) => option.value).join('\0');

  const measure = useCallback(() => {
    const active = tabRefs.current.get(value);
    if (!active) return;
    const next = { left: active.offsetLeft, width: active.offsetWidth };
    setPill((prev) => (prev.left === next.left && prev.width === next.width ? prev : next));
  }, [value]);

  useLayoutEffect(() => {
    measure();
  }, [measure, optionsKey]);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => {
      measure();
    });
    observer.observe(list);
    for (const button of tabRefs.current.values()) {
      observer.observe(button);
    }
    return () => observer.disconnect();
  }, [measure, optionsKey]);

  const setTabRef = useCallback((optionValue: T, node: HTMLButtonElement | null) => {
    if (node) {
      tabRefs.current.set(optionValue, node);
    } else {
      tabRefs.current.delete(optionValue);
    }
  }, []);

  const focusTab = (index: number) => {
    const option = options[index];
    if (!option || option.disabled) return;
    tabRefs.current.get(option.value)?.focus();
    onChange(option.value);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = options.findIndex((option) => option.value === value);
    if (currentIndex < 0) return;

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      for (let step = 1; step <= options.length; step += 1) {
        const next = (currentIndex + step) % options.length;
        if (!options[next]?.disabled) {
          focusTab(next);
          return;
        }
      }
    }

    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      for (let step = 1; step <= options.length; step += 1) {
        const next = (currentIndex - step + options.length) % options.length;
        if (!options[next]?.disabled) {
          focusTab(next);
          return;
        }
      }
    }

    if (event.key === 'Home') {
      event.preventDefault();
      const first = options.findIndex((option) => !option.disabled);
      if (first >= 0) focusTab(first);
    }

    if (event.key === 'End') {
      event.preventDefault();
      for (let index = options.length - 1; index >= 0; index -= 1) {
        if (!options[index]?.disabled) {
          focusTab(index);
          return;
        }
      }
    }
  };

  const style = {
    '--segmented-pill-left': `${pill.left}px`,
    '--segmented-pill-width': `${pill.width}px`,
  } as CSSProperties;

  return (
    <div
      ref={listRef}
      className={cn('segmented', size === 'sm' && 'segmented--sm', className)}
      role="tablist"
      aria-label={ariaLabel}
      style={style}
      onKeyDown={handleKeyDown}
    >
      <span className="segmented__pill" aria-hidden="true" />
      {options.map((option, index) => {
        const selected = option.value === value;
        const showSeparator =
          index > 0 &&
          !selected &&
          options[index - 1]?.value !== value &&
          !options[index - 1]?.disabled;

        return (
          <button
            key={option.value}
            ref={(node) => setTabRef(option.value, node)}
            type="button"
            role="tab"
            className={cn(
              'segmented__tab',
              selected && 'segmented__tab--active',
              showSeparator && 'segmented__tab--separator',
            )}
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
