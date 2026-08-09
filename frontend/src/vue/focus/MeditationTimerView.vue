<template>
  <div class="meditation-page">
    <header class="meditation-page__header">
      <span>Восстановление внимания</span>
      <h1>Медитации</h1>
      <p>Сделайте спокойный перерыв с дыхательной практикой или включите таймер тишины.</p>
    </header>

    <div class="meditation-layout">
      <section class="meditation-session" aria-labelledby="meditation-session-title">
        <p class="meditation-session__eyebrow" id="meditation-session-title">{{ practiceTitle }}</p>

        <div class="meditation-session__progress" :style="progressStyle">
          <div
            class="meditation-session__orb"
            :class="orbClass"
            :style="orbStyle"
            aria-hidden="true"
          />
          <div class="meditation-session__readout">
            <span
              class="meditation-session__time"
              role="timer"
              :aria-label="'Осталось ' + minutesLeftLabel + ' минут'"
            >
              {{ timeLabel }}
            </span>
            <span class="meditation-session__phase">{{ phaseText }}</span>
          </div>
        </div>

        <p class="sr-only" role="status" aria-live="polite" aria-atomic="true">{{ liveStatus }}</p>

        <div class="meditation-session__actions">
          <button
            v-if="status === 'running'"
            type="button"
            class="btn-primary"
            @click="onPause?.()"
          >
            Пауза
          </button>
          <button v-else type="button" class="btn-primary" @click="onStart?.()">
            {{ startLabel }}
          </button>
          <button type="button" class="btn-ghost" @click="onReset?.()">Сбросить</button>
        </div>

        <p v-if="status === 'completed'" class="meditation-session__complete">
          Практика завершена. Возвращайтесь к работе в своём темпе.
        </p>
      </section>

      <aside class="meditation-practices" aria-label="Выбор практики">
        <h2>Выберите практику</h2>
        <div class="meditation-practices__list">
          <button
            v-for="item in practices"
            :key="item.id"
            type="button"
            class="meditation-practice"
            :class="{ 'meditation-practice--active': practiceId === item.id }"
            :disabled="status === 'running'"
            :aria-pressed="practiceId === item.id"
            @click="onSelectPractice?.(item.id)"
          >
            <span>
              <strong>{{ item.title }}</strong>
              <small>{{ item.description }}</small>
            </span>
            <b>{{ item.id === 'silence' ? customMinutes + ' мин' : item.minutes + ' мин' }}</b>
          </button>
        </div>

        <label v-if="practiceId === 'silence'" class="task-drawer__field">
          <span>Продолжительность, мин</span>
          <input
            type="number"
            min="1"
            max="60"
            :value="customMinutes"
            class="glass-input"
            :disabled="status === 'running'"
            @input="onCustomMinutesChange?.(Number($event.target.value))"
          />
        </label>

        <label class="forms-editor__checkbox">
          <input
            type="checkbox"
            :checked="soundEnabled"
            @change="onSoundEnabledChange?.($event.target.checked)"
          />
          Сигнал в конце практики
        </label>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  practiceId: { type: String, default: 'calm' },
  practiceTitle: { type: String, default: '' },
  practices: { type: Array, default: () => [] },
  customMinutes: { type: Number, default: 10 },
  status: { type: String, default: 'idle' },
  timeLabel: { type: String, default: '00:00' },
  minutesLeftLabel: { type: [Number, String], default: 0 },
  progress: { type: Number, default: 0 },
  phaseText: { type: String, default: '' },
  liveStatus: { type: String, default: '' },
  breathType: { type: String, default: '' },
  breathSeconds: { type: Number, default: 0 },
  soundEnabled: { type: Boolean, default: true },
  onSelectPractice: { type: Function, default: null },
  onCustomMinutesChange: { type: Function, default: null },
  onSoundEnabledChange: { type: Function, default: null },
  onStart: { type: Function, default: null },
  onPause: { type: Function, default: null },
  onReset: { type: Function, default: null },
})

const progressStyle = computed(() => ({
  '--meditation-progress': `${props.progress}%`,
}))

const orbClass = computed(() =>
  props.breathType ? `meditation-session__orb--${props.breathType}` : '',
)

const orbStyle = computed(() =>
  props.breathType ? { '--breath-duration': `${props.breathSeconds}s` } : undefined,
)

const startLabel = computed(() => {
  if (props.status === 'paused') return 'Продолжить'
  if (props.status === 'completed') return 'Ещё раз'
  return 'Начать'
})
</script>
