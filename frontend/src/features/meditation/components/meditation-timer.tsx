'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { formatTimer, playPhaseCompleteSound } from '@/shared/lib/pomodoro-sound';
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

  const selectPractice = (nextId: MeditationPracticeId) => {
    const nextPractice =
      MEDITATION_PRACTICES.find((item) => item.id === nextId) ?? MEDITATION_PRACTICES[0];
    const nextMinutes = nextPractice.id === 'silence' ? customMinutes : nextPractice.minutes;

    endAtRef.current = null;
    setPracticeId(nextId);
    setStatus('idle');
    setSecondsLeft(nextMinutes * 60);
  };

  const handleCustomMinutesChange = (value: number) => {
    const minutes = clampMeditationMinutes(value);
    setCustomMinutes(minutes);
    if (practice.id === 'silence' && status === 'idle') {
      setSecondsLeft(minutes * 60);
    }
  };

  const handleStart = () => {
    const nextSeconds = status === 'idle' || status === 'completed' ? totalSeconds : secondsLeft;
    setSecondsLeft(nextSeconds);
    endAtRef.current = Date.now() + nextSeconds * 1000;
    setStatus('running');
  };

  const handlePause = () => {
    endAtRef.current = null;
    setStatus('paused');
  };

  const handleReset = () => {
    endAtRef.current = null;
    setSecondsLeft(totalSeconds);
    setStatus('idle');
  };

  const phaseText = breathingPhase
    ? `${PHASE_LABELS[breathingPhase.type]} · ${breathingPhase.secondsLeft}`
    : 'Оставайтесь в тишине';

  return (
    <div className="meditation-page">
      <header className="meditation-page__header">
        <span>Восстановление внимания</span>
        <h1>Медитации</h1>
        <p>Сделайте спокойный перерыв с дыхательной практикой или включите таймер тишины.</p>
      </header>

      <div className="meditation-layout">
        <section className="meditation-session" aria-labelledby="meditation-session-title">
          <p className="meditation-session__eyebrow" id="meditation-session-title">
            {practice.title}
          </p>

          <div
            className="meditation-session__progress"
            style={{ '--meditation-progress': `${progress}%` } as React.CSSProperties}
          >
            <div
              className={`meditation-session__orb${
                breathingPhase ? ` meditation-session__orb--${breathingPhase.type}` : ''
              }`}
              style={
                breathingPhase
                  ? ({
                      '--breath-duration': `${breathingPhase.seconds}s`,
                    } as React.CSSProperties)
                  : undefined
              }
              aria-hidden="true"
            />
            <div className="meditation-session__readout">
              <span
                className="meditation-session__time"
                role="timer"
                aria-label={`Осталось ${Math.ceil(secondsLeft / 60)} минут`}
              >
                {formatTimer(secondsLeft)}
              </span>
              <span className="meditation-session__phase">{phaseText}</span>
            </div>
          </div>

          <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
            {status === 'completed'
              ? 'Практика завершена'
              : status === 'paused'
                ? 'Практика на паузе'
                : status === 'running' && breathingPhase
                  ? PHASE_LABELS[breathingPhase.type]
                  : ''}
          </p>

          <div className="meditation-session__actions">
            {status === 'running' ? (
              <button type="button" className="btn-primary" onClick={handlePause}>
                Пауза
              </button>
            ) : (
              <button type="button" className="btn-primary" onClick={handleStart}>
                {status === 'paused' ? 'Продолжить' : status === 'completed' ? 'Ещё раз' : 'Начать'}
              </button>
            )}
            <button type="button" className="btn-ghost" onClick={handleReset}>
              Сбросить
            </button>
          </div>

          {status === 'completed' ? (
            <p className="meditation-session__complete">
              Практика завершена. Возвращайтесь к работе в своём темпе.
            </p>
          ) : null}
        </section>

        <aside className="meditation-practices" aria-label="Выбор практики">
          <h2>Выберите практику</h2>
          <div className="meditation-practices__list">
            {MEDITATION_PRACTICES.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`meditation-practice${
                  practice.id === item.id ? ' meditation-practice--active' : ''
                }`}
                onClick={() => selectPractice(item.id)}
                disabled={status === 'running'}
                aria-pressed={practice.id === item.id}
              >
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.description}</small>
                </span>
                <b>{item.id === 'silence' ? `${customMinutes} мин` : `${item.minutes} мин`}</b>
              </button>
            ))}
          </div>

          {practice.id === 'silence' ? (
            <label className="task-drawer__field">
              <span>Продолжительность, мин</span>
              <input
                type="number"
                min={1}
                max={60}
                value={customMinutes}
                onChange={(event) => handleCustomMinutesChange(Number(event.target.value))}
                className="glass-input"
                disabled={status === 'running'}
              />
            </label>
          ) : null}

          <label className="forms-editor__checkbox">
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(event) => setSoundEnabled(event.target.checked)}
            />
            Сигнал в конце практики
          </label>
        </aside>
      </div>
    </div>
  );
}
