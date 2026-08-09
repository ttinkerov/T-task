'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import { formatTimer, playPhaseCompleteSound } from '@/shared/lib/pomodoro-sound';
import MeditationTimerView from '@/vue/focus/MeditationTimerView.vue';
import {
  clampMeditationMinutes,
  getBreathingPhase,
  getRemainingSeconds,
  MEDITATION_PRACTICES,
  type MeditationPracticeId,
} from '../meditation-timer';

type MeditationStatus = 'idle' | 'running' | 'paused' | 'completed';

const PHASE_LABELS = {
  inhale: 'Вдох',
  hold: 'Пауза',
  exhale: 'Выдох',
} as const;

const PRACTICE_OPTIONS = MEDITATION_PRACTICES.map((item) => ({
  id: item.id,
  title: item.title,
  description: item.description,
  minutes: item.minutes,
}));

export function MeditationTimer() {
  const [practiceId, setPracticeId] = useState<MeditationPracticeId>('calm');
  const [customMinutes, setCustomMinutes] = useState(10);
  const [status, setStatus] = useState<MeditationStatus>('idle');
  const [secondsLeft, setSecondsLeft] = useState(MEDITATION_PRACTICES[0].minutes * 60);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const endAtRef = useRef<number | null>(null);

  const practice =
    MEDITATION_PRACTICES.find((item) => item.id === practiceId) ?? MEDITATION_PRACTICES[0];
  const durationMinutes = practice.id === 'silence' ? customMinutes : practice.minutes;
  const totalSeconds = durationMinutes * 60;
  const elapsedSeconds = Math.max(0, totalSeconds - secondsLeft);
  const breathingPhase = useMemo(
    () => getBreathingPhase(practice.pattern, elapsedSeconds),
    [elapsedSeconds, practice.pattern],
  );
  const progress = totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0;

  useEffect(() => {
    if (status !== 'running' || endAtRef.current === null) return;

    const tick = () => {
      const remaining = getRemainingSeconds(endAtRef.current!, Date.now());
      setSecondsLeft(remaining);

      if (remaining === 0) {
        endAtRef.current = null;
        setStatus('completed');
        if (soundEnabled) {
          playPhaseCompleteSound();
        }
      }
    };

    tick();
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [soundEnabled, status]);

  useEffect(() => {
    if (status !== 'running') return;

    document.title = `${formatTimer(secondsLeft)} — Медитация`;
    return () => {
      document.title = 'T-task — управление проектами для команд';
    };
  }, [secondsLeft, status]);

  const onSelectPractice = useCallback(
    (nextId: MeditationPracticeId) => {
      const nextPractice =
        MEDITATION_PRACTICES.find((item) => item.id === nextId) ?? MEDITATION_PRACTICES[0];
      const nextMinutes = nextPractice.id === 'silence' ? customMinutes : nextPractice.minutes;

      endAtRef.current = null;
      setPracticeId(nextId);
      setStatus('idle');
      setSecondsLeft(nextMinutes * 60);
    },
    [customMinutes],
  );

  const onCustomMinutesChange = useCallback(
    (value: number) => {
      const minutes = clampMeditationMinutes(value);
      setCustomMinutes(minutes);
      if (practice.id === 'silence' && status === 'idle') {
        setSecondsLeft(minutes * 60);
      }
    },
    [practice.id, status],
  );

  const onStart = useCallback(() => {
    const nextSeconds = status === 'idle' || status === 'completed' ? totalSeconds : secondsLeft;
    setSecondsLeft(nextSeconds);
    endAtRef.current = Date.now() + nextSeconds * 1000;
    setStatus('running');
  }, [secondsLeft, status, totalSeconds]);

  const onPause = useCallback(() => {
    endAtRef.current = null;
    setStatus('paused');
  }, []);

  const onReset = useCallback(() => {
    endAtRef.current = null;
    setSecondsLeft(totalSeconds);
    setStatus('idle');
  }, [totalSeconds]);

  const phaseText = breathingPhase
    ? `${PHASE_LABELS[breathingPhase.type]} · ${breathingPhase.secondsLeft}`
    : 'Оставайтесь в тишине';

  const liveStatus =
    status === 'completed'
      ? 'Практика завершена'
      : status === 'paused'
        ? 'Практика на паузе'
        : status === 'running' && breathingPhase
          ? PHASE_LABELS[breathingPhase.type]
          : '';

  const viewProps = useMemo(
    () => ({
      practiceId,
      practiceTitle: practice.title,
      practices: PRACTICE_OPTIONS,
      customMinutes,
      status,
      timeLabel: formatTimer(secondsLeft),
      minutesLeftLabel: Math.ceil(secondsLeft / 60),
      progress,
      phaseText,
      liveStatus,
      breathType: breathingPhase?.type ?? '',
      breathSeconds: breathingPhase?.seconds ?? 0,
      soundEnabled,
      onSelectPractice,
      onCustomMinutesChange,
      onSoundEnabledChange: setSoundEnabled,
      onStart,
      onPause,
      onReset,
    }),
    [
      practiceId,
      practice.title,
      customMinutes,
      status,
      secondsLeft,
      progress,
      phaseText,
      liveStatus,
      breathingPhase?.type,
      breathingPhase?.seconds,
      soundEnabled,
      onSelectPractice,
      onCustomMinutesChange,
      onStart,
      onPause,
      onReset,
    ],
  );

  return <VueIsland component={MeditationTimerView} componentProps={viewProps} />;
}
