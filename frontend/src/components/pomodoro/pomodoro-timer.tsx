'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import { formatTimer, playPhaseCompleteSound } from '@/shared/lib/pomodoro-sound';
import { usePomodoroStore } from '@/stores/pomodoro.store';
import PomodoroTimerView from '@/vue/focus/PomodoroTimerView.vue';

type PomodoroPhase = 'focus' | 'break';
type PomodoroStatus = 'idle' | 'running' | 'paused';

const PRESETS = [
  { focus: 25, break: 5, label: '25 / 5' },
  { focus: 50, break: 10, label: '50 / 10' },
  { focus: 15, break: 3, label: '15 / 3' },
];

export function PomodoroTimer() {
  const {
    focusMinutes,
    breakMinutes,
    soundEnabled,
    completedToday,
    setFocusMinutes,
    setBreakMinutes,
    setSoundEnabled,
    incrementCompleted,
  } = usePomodoroStore();

  const [phase, setPhase] = useState<PomodoroPhase>('focus');
  const [status, setStatus] = useState<PomodoroStatus>('idle');
  const [secondsLeft, setSecondsLeft] = useState(focusMinutes * 60);

  const totalSeconds = (phase === 'focus' ? focusMinutes : breakMinutes) * 60;

  const progress = useMemo(() => {
    if (totalSeconds <= 0) return 0;
    return ((totalSeconds - secondsLeft) / totalSeconds) * 100;
  }, [secondsLeft, totalSeconds]);

  useEffect(() => {
    if (status !== 'running') return;

    const interval = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [status]);

  useEffect(() => {
    if (status !== 'running' || secondsLeft > 0) return;

    if (soundEnabled) {
      playPhaseCompleteSound();
    }

    if (phase === 'focus') {
      incrementCompleted();
      setPhase('break');
      setSecondsLeft(breakMinutes * 60);
      return;
    }

    setPhase('focus');
    setSecondsLeft(focusMinutes * 60);
  }, [breakMinutes, focusMinutes, incrementCompleted, phase, secondsLeft, soundEnabled, status]);

  useEffect(() => {
    const label =
      status === 'running'
        ? `${formatTimer(secondsLeft)} — ${phase === 'focus' ? 'Фокус' : 'Перерыв'}`
        : 'Помодоро — T-task';
    document.title = label;
    return () => {
      document.title = 'T-task — управление проектами для команд';
    };
  }, [phase, secondsLeft, status]);

  const onStart = useCallback(() => {
    if (status === 'idle') {
      setSecondsLeft(phase === 'focus' ? focusMinutes * 60 : breakMinutes * 60);
    }
    setStatus('running');
  }, [breakMinutes, focusMinutes, phase, status]);

  const onPause = useCallback(() => setStatus('paused'), []);

  const onReset = useCallback(() => {
    setStatus('idle');
    setPhase('focus');
    setSecondsLeft(focusMinutes * 60);
  }, [focusMinutes]);

  const onSkip = useCallback(() => {
    if (phase === 'focus') {
      setPhase('break');
      setSecondsLeft(breakMinutes * 60);
    } else {
      setPhase('focus');
      setSecondsLeft(focusMinutes * 60);
    }
    setStatus('running');
  }, [breakMinutes, focusMinutes, phase]);

  const onApplyPreset = useCallback(
    (focus: number, breakMins: number) => {
      setFocusMinutes(focus);
      setBreakMinutes(breakMins);
      setStatus('idle');
      setPhase('focus');
      setSecondsLeft(focus * 60);
    },
    [setBreakMinutes, setFocusMinutes],
  );

  const onFocusMinutesChange = useCallback(
    (value: number) => {
      const minutes = Math.min(90, Math.max(1, value));
      setFocusMinutes(minutes);
      if (status === 'idle' && phase === 'focus') {
        setSecondsLeft(minutes * 60);
      }
    },
    [phase, setFocusMinutes, status],
  );

  const onBreakMinutesChange = useCallback(
    (value: number) => {
      const minutes = Math.min(30, Math.max(1, value));
      setBreakMinutes(minutes);
      if (status === 'idle' && phase === 'break') {
        setSecondsLeft(minutes * 60);
      }
    },
    [phase, setBreakMinutes, status],
  );

  const viewProps = useMemo(
    () => ({
      phase,
      status,
      timeLabel: formatTimer(secondsLeft),
      progress,
      completedToday,
      focusMinutes,
      breakMinutes,
      soundEnabled,
      presets: PRESETS,
      onStart,
      onPause,
      onSkip,
      onReset,
      onApplyPreset,
      onFocusMinutesChange,
      onBreakMinutesChange,
      onSoundEnabledChange: setSoundEnabled,
    }),
    [
      phase,
      status,
      secondsLeft,
      progress,
      completedToday,
      focusMinutes,
      breakMinutes,
      soundEnabled,
      onStart,
      onPause,
      onSkip,
      onReset,
      onApplyPreset,
      onFocusMinutesChange,
      onBreakMinutesChange,
      setSoundEnabled,
    ],
  );

  return <VueIsland component={PomodoroTimerView} componentProps={viewProps} />;
}
