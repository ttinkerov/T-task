'use client';

import { motion } from 'framer-motion';

const columns = [
  {
    title: 'Backlog',
    color: 'from-slate-500/30 to-slate-600/10',
    tasks: ['Research', 'Wireframes'],
  },
  {
    title: 'In Progress',
    color: 'from-cyan-500/35 to-indigo-500/15',
    tasks: ['API design', 'Kanban UI'],
  },
  {
    title: 'Done',
    color: 'from-violet-500/35 to-fuchsia-500/15',
    tasks: ['Auth flow', 'Workspaces'],
  },
];

export function Kanban3DScene({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`perspective-scene ${compact ? 'scale-[0.85]' : ''}`}>
      <motion.div
        className="relative mx-auto w-full max-w-lg"
        initial={{ opacity: 0, rotateX: 18, rotateY: -14, y: 40 }}
        animate={{ opacity: 1, rotateX: 12, rotateY: -10, y: 0 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <motion.div
          className="glass-panel absolute -inset-4 rounded-3xl"
          style={{ transform: 'translateZ(-40px)' }}
          animate={{ rotateZ: [0, 0.5, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        />

        <div
          className="glass-panel relative rounded-2xl p-4 sm:p-5"
          style={{ transform: 'translateZ(20px)', transformStyle: 'preserve-3d' }}
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-cyan-300/80">
                Sprint board
              </p>
              <p className="font-display text-lg font-semibold text-white">Product Launch</p>
            </div>
            <div className="flex -space-x-2">
              {['A', 'M', 'K'].map((initial, index) => (
                <div
                  key={initial}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-cyan-400/80 to-indigo-500/80 text-xs font-bold text-slate-900"
                  style={{ transform: `translateZ(${12 + index * 4}px)` }}
                >
                  {initial}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {columns.map((column, columnIndex) => (
              <motion.div
                key={column.title}
                className={`rounded-xl bg-gradient-to-b ${column.color} p-2.5`}
                style={{ transform: `translateZ(${8 + columnIndex * 6}px)` }}
                animate={{ y: [0, columnIndex % 2 === 0 ? -4 : 4, 0] }}
                transition={{
                  duration: 4 + columnIndex,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-300/90">
                  {column.title}
                </p>
                <div className="space-y-2">
                  {column.tasks.map((task, taskIndex) => (
                    <motion.div
                      key={task}
                      className="rounded-lg border border-white/10 bg-slate-900/50 px-2 py-2 text-xs text-slate-200"
                      style={{ transform: `translateZ(${16 + taskIndex * 8}px)` }}
                      whileHover={{ scale: 1.03, translateZ: 24 }}
                    >
                      {task}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          className="absolute -right-6 top-8 hidden rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs text-cyan-100 sm:block"
          style={{ transform: 'translateZ(60px)' }}
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3.5, repeat: Infinity }}
        >
          Realtime sync
        </motion.div>

        <motion.div
          className="absolute -left-4 bottom-6 hidden rounded-xl border border-violet-400/20 bg-violet-400/10 px-3 py-2 text-xs text-violet-100 sm:block"
          style={{ transform: 'translateZ(48px)' }}
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 4.2, repeat: Infinity }}
        >
          Team workspaces
        </motion.div>
      </motion.div>
    </div>
  );
}
