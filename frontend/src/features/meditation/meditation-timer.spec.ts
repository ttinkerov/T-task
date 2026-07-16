import { describe, expect, it } from 'vitest';
import { clampMeditationMinutes, getBreathingPhase, getRemainingSeconds } from './meditation-timer';

describe('meditation timer utilities', () => {
  it('clamps custom duration to the supported range', () => {
    expect(clampMeditationMinutes(0)).toBe(1);
    expect(clampMeditationMinutes(12)).toBe(12);
    expect(clampMeditationMinutes(90)).toBe(60);
  });

  it('never returns a negative countdown', () => {
    expect(getRemainingSeconds(1_000, 2_500)).toBe(0);
    expect(getRemainingSeconds(7_500, 2_500)).toBe(5);
  });

  it('calculates each phase of a breathing cycle', () => {
    const pattern = [
      { type: 'inhale' as const, seconds: 4 },
      { type: 'hold' as const, seconds: 2 },
      { type: 'exhale' as const, seconds: 6 },
    ];

    expect(getBreathingPhase(pattern, 0)).toMatchObject({ type: 'inhale', secondsLeft: 4 });
    expect(getBreathingPhase(pattern, 4)).toMatchObject({ type: 'hold', secondsLeft: 2 });
    expect(getBreathingPhase(pattern, 6)).toMatchObject({ type: 'exhale', secondsLeft: 6 });
    expect(getBreathingPhase(pattern, 12)).toMatchObject({ type: 'inhale', secondsLeft: 4 });
  });

  it('returns null for a silent practice without breathing phases', () => {
    expect(getBreathingPhase([], 10)).toBeNull();
  });
});
