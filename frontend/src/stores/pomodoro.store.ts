import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PomodoroState {
  focusMinutes: number;
  breakMinutes: number;
  soundEnabled: boolean;
  completedToday: number;
  setFocusMinutes: (minutes: number) => void;
  setBreakMinutes: (minutes: number) => void;
  setSoundEnabled: (enabled: boolean) => void;
  incrementCompleted: () => void;
}

export const usePomodoroStore = create<PomodoroState>()(
  persist(
    (set, get) => ({
      focusMinutes: 25,
      breakMinutes: 5,
      soundEnabled: true,
      completedToday: 0,
      setFocusMinutes: (minutes) => set({ focusMinutes: minutes }),
      setBreakMinutes: (minutes) => set({ breakMinutes: minutes }),
      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
      incrementCompleted: () => set({ completedToday: get().completedToday + 1 }),
    }),
    { name: 'ttask-pomodoro' },
  ),
);
