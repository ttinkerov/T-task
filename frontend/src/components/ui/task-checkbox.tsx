'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

interface TaskCheckboxProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}

export function TaskCheckbox({
  checked,
  onChange,
  disabled,
  ariaLabel = 'Отметить выполненной',
  className,
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
      <motion.span
        initial={false}
        animate={checked ? { scale: 1, opacity: 1 } : { scale: 0.4, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 520, damping: 28 }}
      >
        <Check strokeWidth={2.75} />
      </motion.span>
    </button>
  );
}
