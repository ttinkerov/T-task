import confetti from 'canvas-confetti';

export function celebrateTaskComplete(origin?: { x: number; y: number }) {
  if (typeof window === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  void confetti({
    particleCount: 42,
    spread: 58,
    startVelocity: 28,
    gravity: 0.9,
    ticks: 120,
    scalar: 0.85,
    origin: origin ?? { x: 0.5, y: 0.35 },
    colors: ['#be185d', '#e11d74', '#34d399', '#f4f4f5', '#fbbf24'],
  });
}
