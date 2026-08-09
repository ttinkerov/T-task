<template>
  <div class="analytics-page">
    <header class="analytics-page__header">
      <div>
        <h1 class="analytics-page__title">Аналитика</h1>
        <p class="analytics-page__subtitle">
          Контролируйте прогресс каждого участника: выберите период и сотрудника, чтобы увидеть
          план, факт и список задач.
        </p>
      </div>
    </header>

    <p v-if="workloadTruncated" class="text-sm text-muted-foreground" role="status">
      Показаны первые 5000 задач доски для расчёта нагрузки.
    </p>

    <div v-if="summaryError" class="analytics-page__error" role="alert">
      <p>{{ summaryError }}</p>
      <button type="button" class="btn-ghost" @click="onRetrySummary?.()">Повторить</button>
    </div>

    <div class="analytics-summary-cards analytics-summary-cards--grid">
      <article v-for="card in summaryCards" :key="card.label" class="glass-card analytics-summary-card">
        <p class="text-sm text-muted-foreground">{{ card.label }}</p>
        <p class="analytics-summary-card__value">{{ card.value }}</p>
      </article>
    </div>

    <div ref="stuckHostEl" class="analytics-stuck-host" v-once />

    <div v-if="workloadError" class="analytics-page__error" role="alert">
      <p>{{ workloadError }}</p>
      <button type="button" class="btn-ghost" @click="onRetryWorkload?.()">Повторить</button>
    </div>

    <p v-else-if="workloadLoading" class="text-sm text-muted-foreground">
      Загрузка нагрузки по доске...
    </p>

    <div class="analytics-filters">
      <div class="analytics-filters__group">
        <span class="analytics-filters__label">Период</span>
        <div class="analytics-filters__periods" role="tablist" aria-label="Период аналитики">
          <button
            v-for="option in periodOptions"
            :key="option.value"
            type="button"
            role="tab"
            :aria-selected="period === option.value"
            :class="
              period === option.value
                ? 'board-workload__toggle-btn board-workload__toggle-btn--active'
                : 'board-workload__toggle-btn'
            "
            @click="onPeriodChange?.(option.value)"
          >
            {{ option.label }}
          </button>
        </div>
      </div>

      <div v-if="period === 'custom'" class="analytics-filters__dates">
        <label class="analytics-filters__date-field">
          <span>С</span>
          <input
            type="date"
            class="glass-input"
            :value="customFrom"
            @change="onCustomFromChange?.($event.target.value)"
          />
        </label>
        <label class="analytics-filters__date-field">
          <span>По</span>
          <input
            type="date"
            class="glass-input"
            :value="customTo"
            @change="onCustomToChange?.($event.target.value)"
          />
        </label>
      </div>

      <label class="analytics-filters__member">
        <span class="analytics-filters__label">Сотрудник</span>
        <select
          class="glass-input"
          :value="assigneeFilter"
          :disabled="Boolean(membersError)"
          @change="onAssigneeChange?.($event.target.value)"
        >
          <option value="">Вся команда</option>
          <option v-for="member in members" :key="member.userId" :value="member.userId">
            {{ member.user.name }}
          </option>
          <option value="unassigned">Без исполнителя</option>
        </select>
        <p v-if="membersError" class="analytics-page__error" role="alert">
          {{ membersError }}
          <button type="button" class="board-filters__chip" @click="onRetryMembers?.()">
            Повторить
          </button>
        </p>
      </label>
    </div>

    <section class="analytics-summary">
      <div class="analytics-summary__head">
        <h2 class="analytics-summary__title">Продуктивность команды</h2>
        <p class="analytics-summary__hint">
          Показатели {{ periodLabel }}. Нажмите на сотрудника, чтобы увидеть его задачи.
        </p>
      </div>

      <p v-if="rows.length === 0" class="analytics-summary__empty">
        Нет задач с оценкой времени за выбранный период. Укажите план и факт в карточках на доске.
      </p>

      <div v-else class="board-workload__table-wrap">
        <table class="board-workload__table analytics-table">
          <thead>
            <tr>
              <th>Сотрудник</th>
              <th>План</th>
              <th>Факт</th>
              <th>Δ</th>
              <th>Задач</th>
              <th>Эффективность</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in rows"
              :key="row.id"
              :class="
                drilldownId === row.id
                  ? 'analytics-table__row analytics-table__row--active'
                  : 'analytics-table__row'
              "
              role="button"
              tabindex="0"
              :aria-pressed="drilldownId === row.id"
              @click="onToggleDrilldown?.(row.id)"
              @keydown.enter.prevent="onToggleDrilldown?.(row.id)"
              @keydown.space.prevent="onToggleDrilldown?.(row.id)"
            >
              <td>{{ row.name }}</td>
              <td>{{ row.plan }}</td>
              <td>{{ row.actual }}</td>
              <td>
                <span v-if="row.deltaTone" :class="'board-workload__delta board-workload__delta--' + row.deltaTone">
                  {{ row.delta }}
                </span>
                <span v-else-if="row.delta !== '—'" class="board-workload__delta">{{ row.delta }}</span>
                <template v-else>—</template>
              </td>
              <td>{{ row.taskCount }}</td>
              <td>{{ row.efficiency }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td>Итого</td>
              <td>{{ totals.plan }}</td>
              <td>{{ totals.actual }}</td>
              <td>{{ totals.delta }}</td>
              <td>{{ totals.taskCount }}</td>
              <td>{{ totals.efficiency }}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>

    <section v-if="drilldown" class="analytics-drilldown">
      <div class="analytics-drilldown__head">
        <div>
          <h3 class="analytics-drilldown__title">{{ drilldown.name }}</h3>
          <p class="analytics-drilldown__hint">{{ drilldown.hint }}</p>
        </div>
        <button type="button" class="btn-ghost" @click="onCloseDrilldown?.()">Свернуть</button>
      </div>

      <p v-if="drilldown.tasks.length === 0" class="analytics-drilldown__empty">
        Нет задач за выбранный период.
      </p>

      <div v-else class="board-workload__table-wrap">
        <table class="board-workload__table">
          <thead>
            <tr>
              <th>Задача</th>
              <th>Колонка</th>
              <th>План</th>
              <th>Факт</th>
              <th>Дедлайн</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="task in drilldown.tasks" :key="task.id">
              <td class="analytics-drilldown__task-title">{{ task.title }}</td>
              <td>{{ task.columnName }}</td>
              <td>{{ task.plan }}</td>
              <td>{{ task.actual }}</td>
              <td>{{ task.due }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  summaryCards: { type: Array, default: () => [] },
  summaryError: { type: String, default: '' },
  workloadError: { type: String, default: '' },
  membersError: { type: String, default: '' },
  workloadTruncated: { type: Boolean, default: false },
  workloadLoading: { type: Boolean, default: false },
  period: { type: String, required: true },
  customFrom: { type: String, default: '' },
  customTo: { type: String, default: '' },
  assigneeFilter: { type: String, default: '' },
  members: { type: Array, default: () => [] },
  periodLabel: { type: String, default: '' },
  rows: { type: Array, default: () => [] },
  totals: { type: Object, required: true },
  drilldownId: { type: String, default: null },
  drilldown: { type: Object, default: null },
  onPeriodChange: { type: Function, default: null },
  onCustomFromChange: { type: Function, default: null },
  onCustomToChange: { type: Function, default: null },
  onAssigneeChange: { type: Function, default: null },
  onToggleDrilldown: { type: Function, default: null },
  onCloseDrilldown: { type: Function, default: null },
  onStuckHostReady: { type: Function, default: null },
  onRetrySummary: { type: Function, default: null },
  onRetryWorkload: { type: Function, default: null },
  onRetryMembers: { type: Function, default: null },
})

const periodOptions = [
  { value: 'today', label: 'День' },
  { value: 'week', label: 'Неделя' },
  { value: 'month', label: 'Месяц' },
  { value: 'all', label: 'Проект' },
  { value: 'custom', label: 'Свой' },
]

const stuckHostEl = ref(null)

function notifyStuckHost(el) {
  props.onStuckHostReady?.(el)
}

onMounted(() => {
  notifyStuckHost(stuckHostEl.value)
})

watch(stuckHostEl, (el) => {
  notifyStuckHost(el)
})

onBeforeUnmount(() => {
  notifyStuckHost(null)
})
</script>
