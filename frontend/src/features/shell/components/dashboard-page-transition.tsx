'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { motionTokens } from '@/shared/lib/motion-tokens';
import { cn } from '@/shared/lib/cn';

/**
 * Enter-only fade for dashboard routes.
 * Avoid AnimatePresence mode="wait" — it can stall first paint with Suspense pages.
 */
export function DashboardPageTransition({
  children,
  fill = false,
}: {
  children: React.ReactNode;
  fill?: boolean;
}) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      key={pathname}
      className={cn('dashboard-page-transition', fill && 'dashboard-page-transition--fill')}
      initial={reduceMotion ? false : { opacity: 0, y: motionTokens.distance.sm }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : motionTokens.duration.fast,
        ease: motionTokens.easing.smooth,
      }}
    >
      {children}
    </motion.div>
  );
}
