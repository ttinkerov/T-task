'use client';

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useCallback, useRef, type ReactNode } from 'react';

export type AccentColor = 'cyan' | 'violet' | 'lime' | 'amber';

interface TiltCard3DProps {
  children: ReactNode;
  className?: string;
  accent?: AccentColor;
  depth?: number;
  delay?: number;
}

export function TiltCard3D({
  children,
  className = '',
  accent,
  depth = 10,
  delay = 0,
}: TiltCard3DProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);

  const spring = { stiffness: 180, damping: 24, mass: 0.5 };
  const rotateX = useSpring(useTransform(pointerY, [-0.5, 0.5], [depth, -depth]), spring);
  const rotateY = useSpring(useTransform(pointerX, [-0.5, 0.5], [-depth, depth]), spring);
  const liftZ = useSpring(useTransform(pointerY, [-0.5, 0.5], [4, 14]), spring);

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const bounds = cardRef.current?.getBoundingClientRect();
      if (!bounds) return;

      pointerX.set((event.clientX - bounds.left) / bounds.width - 0.5);
      pointerY.set((event.clientY - bounds.top) / bounds.height - 0.5);
    },
    [pointerX, pointerY],
  );

  const handlePointerLeave = useCallback(() => {
    pointerX.set(0);
    pointerY.set(0);
  }, [pointerX, pointerY]);

  const accentClass = accent ? ` tt-tilt-card--${accent}` : '';

  return (
    <div
      ref={cardRef}
      className={`tt-tilt-card${accentClass} ${className}`.trim()}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <motion.div
        className="tt-tilt-card__inner"
        style={{
          rotateX,
          rotateY,
          translateZ: liftZ,
          transformStyle: 'preserve-3d',
        }}
        initial={{ opacity: 0, y: 32, rotateX: 12 }}
        whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </div>
  );
}

interface FloatingStat3DProps {
  value: string;
  label: string;
  accent: AccentColor;
  delay?: number;
}

export function FloatingStat3D({ value, label, accent, delay = 0 }: FloatingStat3DProps) {
  return (
    <motion.div
      className={`tt-stat-3d tt-stat-3d--${accent}`}
      initial={{ opacity: 0, y: 24, rotateX: 20 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.7, delay: 0.4 + delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6, rotateX: -8, rotateY: 6, scale: 1.03 }}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <motion.span
        className="tt-stat-3d__glow"
        animate={{ opacity: [0.35, 0.75, 0.35], scale: [0.95, 1.05, 0.95] }}
        transition={{ duration: 3.5 + delay, repeat: Infinity, ease: 'easeInOut' }}
      />
      <span className="tt-stat-3d__value">{value}</span>
      <span className="tt-stat-3d__label">{label}</span>
    </motion.div>
  );
}

interface CtaMedia3DProps {
  src: string;
  alt: string;
}

export function CtaMedia3D({ src, alt }: CtaMedia3DProps) {
  const ref = useRef<HTMLDivElement>(null);
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);

  const rotateX = useSpring(useTransform(pointerY, [-0.5, 0.5], [8, -8]), {
    stiffness: 140,
    damping: 20,
  });
  const rotateY = useSpring(useTransform(pointerX, [-0.5, 0.5], [-10, 10]), {
    stiffness: 140,
    damping: 20,
  });

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const bounds = ref.current?.getBoundingClientRect();
      if (!bounds) return;

      pointerX.set((event.clientX - bounds.left) / bounds.width - 0.5);
      pointerY.set((event.clientY - bounds.top) / bounds.height - 0.5);
    },
    [pointerX, pointerY],
  );

  return (
    <div
      ref={ref}
      className="tt-cta-3d"
      onPointerMove={handlePointerMove}
      onPointerLeave={() => {
        pointerX.set(0);
        pointerY.set(0);
      }}
    >
      <motion.div
        className="tt-cta-3d__frame"
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <img src={src} alt={alt} loading="lazy" />
        <motion.span
          className="tt-cta-3d__badge"
          style={{ transform: 'translateZ(28px)' }}
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          Live sync
        </motion.span>
      </motion.div>
    </div>
  );
}
