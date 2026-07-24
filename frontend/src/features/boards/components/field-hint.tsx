'use client';

import { useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type TipPos = {
  left: number;
  top: number;
  width: number;
  placeBelow: boolean;
};

export function FieldHint({ text }: { text: string }) {
  const tipId = useId();
  const btnRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<TipPos | null>(null);

  const updatePosition = () => {
    const el = btnRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const width = Math.min(260, window.innerWidth - 16);
    const placeBelow = rect.top < 96;
    let left = rect.left + rect.width / 2 - width / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
    const top = placeBelow ? rect.bottom + 8 : rect.top - 8;

    setPos({ left, top, width, placeBelow });
  };

  const show = () => {
    updatePosition();
    setOpen(true);
  };

  const hide = () => setOpen(false);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    const onScroll = () => updatePosition();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [open]);

  return (
    <span className="field-hint">
      <button
        ref={btnRef}
        type="button"
        className="field-hint__btn"
        aria-label="Подсказка"
        aria-describedby={open ? tipId : undefined}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        ?
      </button>
      {open && pos
        ? createPortal(
            <span
              id={tipId}
              role="tooltip"
              className={`field-hint__tip${pos.placeBelow ? ' field-hint__tip--below' : ''}`}
              style={{
                left: pos.left,
                top: pos.top,
                width: pos.width,
              }}
            >
              {text}
            </span>,
            document.body,
          )
        : null}
    </span>
  );
}
