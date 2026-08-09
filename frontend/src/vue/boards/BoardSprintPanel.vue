<template>
  <div class="board-sprint-panel__inner">
    <div class="board-sprint-panel__head">
      <div>
        <p class="board-sprint-panel__eyebrow">Спринт</p>
        <strong>{{
          loadError ? 'Ошибка загрузки' : active ? active.name : 'Нет активного спринта'
        }}</strong>
      </div>
      <div class="board-sprint-panel__actions">
        <button
          v-if="active && !active.closedAt"
          type="button"
          class="btn-ghost"
          :disabled="closePending"
          @click="onCloseSprint?.()"
        >
          Закрыть
        </button>
        <button type="button" class="btn-ghost" @click="formOpen = !formOpen">
          {{ formOpen ? 'Скрыть' : 'Новый' }}
        </button>
      </div>
    </div>

    <form v-if="formOpen" class="board-sprint-panel__form" @submit.prevent="submitCreate">
      <input
        v-model="name"
        class="glass-input"
        placeholder="Название спринта"
        maxlength="120"
        required
      />
      <input v-model="startDate" class="glass-input" type="date" required />
      <input v-model="endDate" class="glass-input" type="date" required />
      <button type="submit" class="btn-primary" :disabled="createPending">Создать</button>
    </form>

    <p v-if="loadError" class="board-sprint-panel__error" role="alert">
      {{ loadError }}
      <button type="button" class="board-filters__chip" @click="onRetry?.()">Повторить</button>
    </p>
    <p v-if="actionError" class="board-sprint-panel__error" role="alert">{{ actionError }}</p>

    <p v-if="activePoints" class="board-sprint-panel__meta board-sprint-panel__meta--points">
      Очки: {{ activePoints.completedPoints }} / {{ activePoints.committedPoints }} SP{{
        velocityLabel
      }}
    </p>

    <div v-if="burndownChart" class="board-sprint-panel__chart" aria-label="Сгорание">
      <svg :viewBox="burndownChart.viewBox" role="img">
        <polyline
          fill="none"
          stroke="var(--tt-border)"
          stroke-width="2"
          :points="burndownChart.idealPoints"
        />
        <polyline
          fill="none"
          stroke="var(--tt-brand)"
          stroke-width="2.5"
          :points="burndownChart.remainingPoints"
        />
      </svg>
      <p class="board-sprint-panel__meta">{{ burndownChart.meta }}</p>
    </div>

    <div
      v-if="velocityBars.length"
      class="board-sprint-panel__velocity"
      aria-label="Скорость команды"
    >
      <p class="board-sprint-panel__eyebrow">Скорость</p>
      <div class="board-sprint-panel__bars">
        <div
          v-for="bar in velocityBars"
          :key="bar.sprintId"
          class="board-sprint-panel__bar-col"
          :title="bar.name"
        >
          <div class="board-sprint-panel__bar-track">
            <span
              class="board-sprint-panel__bar board-sprint-panel__bar--committed"
              :style="{ height: bar.committedHeight }"
            />
            <span
              class="board-sprint-panel__bar board-sprint-panel__bar--completed"
              :style="{ height: bar.completedHeight }"
            />
          </div>
          <span class="board-sprint-panel__bar-label">{{ bar.completedPoints }}</span>
        </div>
      </div>
      <p class="board-sprint-panel__meta">{{ velocityAverageLabel }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  active: { type: Object, default: null },
  activePoints: { type: Object, default: null },
  burndownChart: { type: Object, default: null },
  velocityBars: { type: Array, default: () => [] },
  averageVelocity: { type: Number, default: 0 },
  createPending: { type: Boolean, default: false },
  closePending: { type: Boolean, default: false },
  actionError: { type: String, default: '' },
  loadError: { type: String, default: '' },
  onCreate: { type: Function, default: null },
  onCloseSprint: { type: Function, default: null },
  onRetry: { type: Function, default: null },
})

const formOpen = ref(false)
const name = ref('')
const startDate = ref('')
const endDate = ref('')

const velocityLabel = computed(() =>
  props.averageVelocity > 0 ? ` · скорость ${props.averageVelocity}` : '',
)

const velocityAverageLabel = computed(() =>
  props.averageVelocity > 0
    ? `Средняя скорость по закрытым спринтам: ${props.averageVelocity} SP`
    : 'Средняя скорость по закрытым спринтам: —',
)

async function submitCreate() {
  if (!name.value.trim() || !startDate.value || !endDate.value) return
  try {
    await props.onCreate?.({
      name: name.value.trim(),
      startDate: startDate.value,
      endDate: endDate.value,
    })
    formOpen.value = false
    name.value = ''
    startDate.value = ''
    endDate.value = ''
  } catch {
  }
}
</script>
