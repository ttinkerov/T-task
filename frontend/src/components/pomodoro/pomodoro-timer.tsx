'use client';

import { useEffect, useMemo, useState } from 'react';
import { formatTimer, playPhaseCompleteSound } from '@/shared/lib/pomodoro-sound';
import { usePomodoroStore } from '@/stores/pomodoro.store';

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
        : 'Pomodoro — T-task';
    document.title = label;
    return () => {
      document.title = 'T-task — управление проектами для команд';
    };
  }, [phase, secondsLeft, status]);

  const handleStart = () => {
    if (status === 'idle') {
      setSecondsLeft(phase === 'focus' ? focusMinutes * 60 : breakMinutes * 60);
    }
    setStatus('running');
  };

  const handlePause = () => setStatus('paused');

  const handleReset = () => {
    setStatus('idle');
    setPhase('focus');
    setSecondsLeft(focusMinutes * 60);
  };

  const handleSkip = () => {
    if (phase === 'focus') {
      setPhase('break');
      setSecondsLeft(breakMinutes * 60);
    } else {
      setPhase('focus');
      setSecondsLeft(focusMinutes * 60);
    }
    setStatus('running');
  };

  const applyPreset = (focus: number, breakMins: number) => {
    setFocusMinutes(focus);
    setBreakMinutes(breakMins);
    setStatus('idle');
    setPhase('focus');
    setSecondsLeft(focus * 60);
  };

  const handleFocusChange = (value: number) => {
    const minutes = Math.min(90, Math.max(1, value));
    setFocusMinutes(minutes);
    if (status === 'idle' && phase === 'focus') {
      setSecondsLeft(minutes * 60);
    }
  };

  const handleBreakChange = (value: number) => {
    const minutes = Math.min(30, Math.max(1, value));
    setBreakMinutes(minutes);
    if (status === 'idle' && phase === 'break') {
      setSecondsLeft(minutes * 60);
    }
  };

  return (
    <div className="pomodoro-page">
      <header className="pomodoro-page__header">
        <div>
          <h1 className="pomodoro-page__title">Pomodoro-таймер</h1>
          <p className="pomodoro-page__subtitle">
            Чередуйте периоды фокуса и отдыха. Настройте интервалы под себя — звуковой сигнал
            напомнит о переключении.
          </p>
        </div>
        <p className="pomodoro-page__stat">Сегодня: {completedToday} помодоро</p>
      </header>

      <div className="pomodoro-layout">
        <section className="pomodoro-timer">
          <p className={`pomodoro-timer__phase pomodoro-timer__phase--${phase}`}>
            {phase === 'focus' ? 'Фокус' : 'Перерыв'}
          </p>

          <div
            className="pomodoro-timer__ring"
            style={{
              background: `conic-gradient(var(--tt-brand) ${progress}%, var(--tt-hover) 0)`,
            }}
          >
            <div className="pomodoro-timer__inner">
              <span className="pomodoro-timer__time">{formatTimer(secondsLeft)}</span>
              <span className="pomodoro-timer__hint">
                {status === 'running' ? 'Идёт отсчёт' : status === 'paused' ? 'Пауза' : 'Готов'}
              </span>
            </div>
          </div>

          <div className="pomodoro-timer__actions">
            {status === 'running' ? (
              <button type="button" className="btn-primary" onClick={handlePause}>
                Пауза
              </button>
            ) : (
              <button type="button" className="btn-primary" onClick={handleStart}>
                {status === 'paused' ? 'Продолжить' : 'Старт'}
              </button>
            )}
            <button type="button" className="btn-ghost" onClick={handleSkip}>
              Пропустить
            </button>
            <button type="button" className="btn-ghost" onClick={handleReset}>
              Сброс
            </button>
          </div>
        </section>

        <aside className="pomodoro-settings">
          <h2 className="pomodoro-settings__title">Настройки</h2>

          <div className="pomodoro-settings__presets">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                className={
                  focusMinutes === preset.focus && breakMinutes === preset.break
                    ? 'board-workload__toggle-btn board-workload__toggle-btn--active'
                    : 'board-workload__toggle-btn'
                }
                onClick={() => applyPreset(preset.focus, preset.break)}
                disabled={status === 'running'}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <label className="task-drawer__field">
            <span>Фокус, мин</span>
            <input
              type="number"
              min={1}
              max={90}
              value={focusMinutes}
              onChange={(event) => handleFocusChange(Number(event.target.value))}
              className="glass-input"
              disabled={status === 'running'}
            />
          </label>

          <label className="task-drawer__field">
            <span>Перерыв, мин</span>
            <input
              type="number"
              min={1}
              max={30}
              value={breakMinutes}
              onChange={(event) => handleBreakChange(Number(event.target.value))}
              className="glass-input"
              disabled={status === 'running'}
            />
          </label>

          <label className="forms-editor__checkbox">
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(event) => setSoundEnabled(event.target.checked)}
            />
            Звуковой сигнал при смене фазы
          </label>

          <p className="pomodoro-settings__tip">
            Классический Pomodoro — 25 минут работы и 5 минут отдыха. После 4 циклов сделайте
            длинный перерыв.
          </p>
        </aside>
      </div>
    </div>
  );
}
