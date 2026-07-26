'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

export function LazyMount({
  children,
  eagerMs = 0,
  placeholder = null,
  rootMargin = '120px',
}: {
  children: ReactNode;
  eagerMs?: number;
  placeholder?: ReactNode;
  rootMargin?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(eagerMs === 0 ? false : false);

  useEffect(() => {
    let timeoutId: number | null = null;
    if (eagerMs > 0) {
      timeoutId = window.setTimeout(() => setVisible(true), eagerMs);
    }

    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return () => {
        if (timeoutId) window.clearTimeout(timeoutId);
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(node);

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [eagerMs, rootMargin]);

  return <div ref={ref}>{visible ? children : placeholder}</div>;
}
