'use client';

import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/shared/lib/cn';

interface TaskCheckboxProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
  /** Skip framer-motion — use on dense lists (kanban cards). */
  animated?: boolean;
}

export function TaskCheckbox({
  checked,
  onChange,
  disabled,
  ariaLabel = 'Отметить выполненной',
  className,
  animated = true,
}: TaskCheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      className={cn('tt-checkbox', checked && 'tt-checkbox--checked', className)}
      onClick={(event) => {
        event.stopPropagation();
        onChange?.(!checked);
      }}
    >
      {animated ? (
        <motion.span
          initial={false}
          animate={checked ? { scale: 1, opacity: 1 } : { scale: 0.4, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 520, damping: 28 }}
        >
          <Check strokeWidth={2.75} />
        </motion.span>
      ) : (
        <span className={cn('tt-checkbox__mark', checked && 'tt-checkbox__mark--on')} aria-hidden>
          <Check strokeWidth={2.75} />
        </span>
      )}
    </button>
  );
}
