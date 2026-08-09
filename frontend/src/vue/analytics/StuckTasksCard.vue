<template>
  <section class="stuck-tasks-card">
    <header class="stuck-tasks-card__head">
      <div>
        <p class="stuck-tasks-card__eyebrow">Здоровье доски</p>
        <h2>Застрявшие задачи</h2>
        <p class="stuck-tasks-card__hint">
          Открытые задачи без обновлений дольше порога (прокси «без движения»).
        </p>
      </div>
      <div class="stuck-tasks-card__controls">
        <label>
          Порог
          <select class="glass-input" :value="days" @change="onDaysChange($event.target.value)">
            <option v-for="value in dayOptions" :key="value" :value="value">
              {{ value }} дн.
            </option>
          </select>
        </label>
        <button
          v-if="aiConfigured"
          type="button"
          class="btn-ghost"
          :disabled="insightPending || isLoading"
          @click="onRequestInsight?.()"
        >
          {{ insightPending ? 'ИИ думает…' : 'Разбор ИИ' }}
        </button>
      </div>
    </header>

    <p v-if="isLoading" class="stuck-tasks-card__hint">Загрузка…</p>
    <p v-else-if="isError" class="stuck-tasks-card__error" role="alert">
      Не удалось загрузить список
      <button type="button" class="board-filters__chip" @click="onRetry?.()">Повторить</button>
    </p>
    <p v-else-if="tasks.length === 0" class="stuck-tasks-card__empty">
      Нет застрявших задач за выбранный порог.
    </p>
    <template v-else>
      <p class="stuck-tasks-card__count">
        Найдено: {{ count }}{{ truncated ? ' (показаны первые 50)' : '' }}
      </p>
      <div class="stuck-tasks-card__table-wrap">
        <table class="stuck-tasks-card__table">
          <thead>
            <tr>
              <th>Задача</th>
              <th>Колонка</th>
              <th>Исполнитель</th>
              <th>Дней без обновлений</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="task in tasks" :key="task.id">
              <td>{{ task.title }}</td>
              <td>{{ task.columnName }}</td>
              <td>{{ task.assigneeName }}</td>
              <td>{{ task.daysSinceUpdate }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <p v-if="insightError" class="stuck-tasks-card__error">{{ insightError }}</p>
    <div v-if="insight" class="stuck-tasks-card__insight">{{ insight }}</div>
  </section>
</template>

<script setup>
const props = defineProps({
  days: { type: Number, required: true },
  dayOptions: { type: Array, default: () => [3, 5, 7, 14] },
  aiConfigured: { type: Boolean, default: false },
  isLoading: { type: Boolean, default: false },
  isError: { type: Boolean, default: false },
  insightPending: { type: Boolean, default: false },
  count: { type: Number, default: 0 },
  truncated: { type: Boolean, default: false },
  tasks: { type: Array, default: () => [] },
  insight: { type: String, default: null },
  insightError: { type: String, default: null },
  onDaysChange: { type: Function, default: null },
  onRequestInsight: { type: Function, default: null },
  onRetry: { type: Function, default: null },
})

function onDaysChange(value) {
  props.onDaysChange?.(Number(value))
}
</script>
