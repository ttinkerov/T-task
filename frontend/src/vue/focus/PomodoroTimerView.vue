<template>
  <div class="pomodoro-page">
    <header class="pomodoro-page__header">
      <div>
        <h1 class="pomodoro-page__title">Pomodoro-таймер</h1>
        <p class="pomodoro-page__subtitle">
          Чередуйте периоды фокуса и отдыха. Настройте интервалы под себя — звуковой сигнал напомнит
          о переключении.
        </p>
      </div>
      <p class="pomodoro-page__stat">Сегодня: {{ completedToday }} помодоро</p>
    </header>

    <div class="pomodoro-layout">
      <section class="pomodoro-timer">
        <p class="pomodoro-timer__phase" :class="'pomodoro-timer__phase--' + phase">
          {{ phase === 'focus' ? 'Фокус' : 'Перерыв' }}
        </p>

        <div class="pomodoro-timer__ring" :style="ringStyle">
          <div class="pomodoro-timer__inner">
            <span class="pomodoro-timer__time">{{ timeLabel }}</span>
            <span class="pomodoro-timer__hint">{{ statusHint }}</span>
          </div>
        </div>

        <div class="pomodoro-timer__actions">
          <button
            v-if="status === 'running'"
            type="button"
            class="btn-primary"
            @click="onPause?.()"
          >
            Пауза
          </button>
          <button v-else type="button" class="btn-primary" @click="onStart?.()">
            {{ status === 'paused' ? 'Продолжить' : 'Старт' }}
          </button>
          <button type="button" class="btn-ghost" @click="onSkip?.()">Пропустить</button>
          <button type="button" class="btn-ghost" @click="onReset?.()">Сброс</button>
        </div>
      </section>

      <aside class="pomodoro-settings">
        <h2 class="pomodoro-settings__title">Настройки</h2>

        <div class="pomodoro-settings__presets">
          <button
            v-for="preset in presets"
            :key="preset.label"
            type="button"
            :class="
              focusMinutes === preset.focus && breakMinutes === preset.break
                ? 'board-workload__toggle-btn board-workload__toggle-btn--active'
                : 'board-workload__toggle-btn'
            "
            :disabled="status === 'running'"
            @click="onApplyPreset?.(preset.focus, preset.break)"
          >
            {{ preset.label }}
          </button>
        </div>

        <label class="task-drawer__field">
          <span>Фокус, мин</span>
          <input
            type="number"
            min="1"
            max="90"
            :value="focusMinutes"
            class="glass-input"
            :disabled="status === 'running'"
            @input="onFocusMinutesChange?.(Number($event.target.value))"
          />
        </label>

        <label class="task-drawer__field">
          <span>Перерыв, мин</span>
          <input
            type="number"
            min="1"
            max="30"
            :value="breakMinutes"
            class="glass-input"
            :disabled="status === 'running'"
            @input="onBreakMinutesChange?.(Number($event.target.value))"
          />
        </label>

        <label class="forms-editor__checkbox">
          <input
            type="checkbox"
            :checked="soundEnabled"
            @change="onSoundEnabledChange?.($event.target.checked)"
          />
          Звуковой сигнал при смене фазы
        </label>

        <p class="pomodoro-settings__tip">
          Классический Pomodoro — 25 минут работы и 5 минут отдыха. После 4 циклов сделайте длинный
          перерыв.
        </p>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  phase: { type: String, default: 'focus' },
  status: { type: String, default: 'idle' },
  timeLabel: { type: String, default: '00:00' },
  progress: { type: Number, default: 0 },
  completedToday: { type: Number, default: 0 },
  focusMinutes: { type: Number, default: 25 },
  breakMinutes: { type: Number, default: 5 },
  soundEnabled: { type: Boolean, default: true },
  presets: { type: Array, default: () => [] },
  onStart: { type: Function, default: null },
  onPause: { type: Function, default: null },
  onSkip: { type: Function, default: null },
  onReset: { type: Function, default: null },
  onApplyPreset: { type: Function, default: null },
  onFocusMinutesChange: { type: Function, default: null },
  onBreakMinutesChange: { type: Function, default: null },
  onSoundEnabledChange: { type: Function, default: null },
})

const ringStyle = computed(() => ({
  background: `conic-gradient(var(--tt-brand) ${props.progress}%, var(--tt-hover) 0)`,
}))

const statusHint = computed(() => {
  if (props.status === 'running') return 'Идёт отсчёт'
  if (props.status === 'paused') return 'Пауза'
  return 'Готов'
})
</script>
