'use client';

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useCallback, useRef } from 'react';
import { MARKETING_IMAGES } from './marketing-images';

const columns = [
  {
    title: 'Backlog',
    tasks: ['Research', 'Wireframes'],
  },
  {
    title: 'In progress',
    active: true,
    tasks: ['API design', 'Kanban UI'],
  },
  {
    title: 'Done',
    tasks: ['Auth flow', 'Workspaces'],
  },
] as const;

const avatars = [
  MARKETING_IMAGES.avatarA,
  MARKETING_IMAGES.avatarM,
  MARKETING_IMAGES.avatarK,
] as const;

export function Kanban3DScene() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);

  const spring = { stiffness: 200, damping: 28 };
  const rotateX = useSpring(useTransform(pointerY, [-0.5, 0.5], [4, -4]), spring);
  const rotateY = useSpring(useTransform(pointerX, [-0.5, 0.5], [-6, 6]), spring);

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const bounds = sceneRef.current?.getBoundingClientRect();
      if (!bounds) return;
      pointerX.set((event.clientX - bounds.left) / bounds.width - 0.5);
      pointerY.set((event.clientY - bounds.top) / bounds.height - 0.5);
    },
    [pointerX, pointerY],
  );

  return (
    <div
      ref={sceneRef}
      className="tt-board"
      onPointerMove={handlePointerMove}
      onPointerLeave={() => {
        pointerX.set(0);
        pointerY.set(0);
      }}
    >
      <motion.div
        className="tt-board__card"
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <div className="tt-board__header">
          <div>
            <p className="tt-board__label">Sprint board</p>
            <p className="tt-board__name">Product Launch</p>
          </div>
          <div className="tt-board__avatars">
            {avatars.map((src) => (
              <img key={src} src={src} alt="" className="tt-board__avatar" />
            ))}
          </div>
        </div>

        <div className="tt-board__columns">
          {columns.map((column) => (
            <div
              key={column.title}
              className={`tt-board__column${'active' in column && column.active ? ' tt-board__column--active' : ''}`}
            >
              <p className="tt-board__column-title">{column.title}</p>
              {column.tasks.map((task) => (
                <div key={task} className="tt-board__task">
                  {task}
                </div>
              ))}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
