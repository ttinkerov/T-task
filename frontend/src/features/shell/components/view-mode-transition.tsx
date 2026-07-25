'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { motionTokens } from '@/shared/lib/motion-tokens';
import { cn } from '@/shared/lib/cn';

/** Soft enter animation when switching Board / Table / Calendar / Timeline. */
export function ViewModeTransition({
  modeKey,
  children,
  className,
}: {
  modeKey: string;
  children: React.ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      key={modeKey}
      className={cn('view-mode-transition', className)}
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : motionTokens.duration.fast,
        ease: motionTokens.easing.soft,
      }}
    >
      {children}
    </motion.div>
  );
}
