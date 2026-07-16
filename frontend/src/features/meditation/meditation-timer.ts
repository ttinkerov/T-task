export type BreathingPhaseType = 'inhale' | 'hold' | 'exhale';

export interface BreathingStep {
  type: BreathingPhaseType;
  seconds: number;
}

export interface ActiveBreathingPhase extends BreathingStep {
  secondsLeft: number;
}

export const MEDITATION_PRACTICES = [
  {
    id: 'calm',
    title: 'Спокойное дыхание',
    description: 'Мягкий ритм 4–2–6, чтобы переключиться после напряжённой задачи.',
    minutes: 5,
    pattern: [
      { type: 'inhale', seconds: 4 },
      { type: 'hold', seconds: 2 },
      { type: 'exhale', seconds: 6 },
    ] satisfies BreathingStep[],
  },
  {
    id: 'reset',
    title: 'Перезагрузка',
    description: 'Ровный цикл с короткими паузами для спокойного возвращения к работе.',
    minutes: 10,
    pattern: [
      { type: 'inhale', seconds: 4 },
      { type: 'hold', seconds: 4 },
      { type: 'exhale', seconds: 6 },
      { type: 'hold', seconds: 2 },
    ] satisfies BreathingStep[],
  },
  {
    id: 'silence',
    title: 'Тишина',
    description: 'Только таймер — без инструкций и фоновой музыки.',
    minutes: 10,
    pattern: [] satisfies BreathingStep[],
  },
] as const;

export type MeditationPracticeId = (typeof MEDITATION_PRACTICES)[number]['id'];

export function clampMeditationMinutes(value: number): number {
  if (!Number.isFinite(value)) return 10;
  return Math.min(60, Math.max(1, Math.round(value)));
}

export function getRemainingSeconds(endAt: number, now: number): number {
  return Math.max(0, Math.ceil((endAt - now) / 1000));
}

export function getBreathingPhase(
  pattern: readonly BreathingStep[],
  elapsedSeconds: number,
): ActiveBreathingPhase | null {
  const cycleSeconds = pattern.reduce((total, step) => total + step.seconds, 0);
  if (cycleSeconds <= 0) return null;

  const cyclePosition = Math.max(0, elapsedSeconds) % cycleSeconds;
  let phaseStart = 0;

  for (const step of pattern) {
    const phaseEnd = phaseStart + step.seconds;
    if (cyclePosition < phaseEnd) {
      return {
        ...step,
        secondsLeft: phaseEnd - cyclePosition,
      };
    }
    phaseStart = phaseEnd;
  }

  return null;
}
