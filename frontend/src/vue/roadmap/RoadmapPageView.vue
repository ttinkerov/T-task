<template>
  <div>
    <header class="roadmap__header">
      <div>
        <p class="roadmap__eyebrow">Рядом с видами задач</p>
        <h1>Роадмап</h1>
        <p>Эпики и сроки по месяцам — та же база задач, другой масштаб.</p>
      </div>
      <strong>{{ epicCount }} эпиков</strong>
    </header>

    <div class="task-view-toolbar">
      <div class="segmented segmented--sm" role="tablist" aria-label="Горизонт">
        <button
          v-for="option in monthOptions"
          :key="option.value"
          type="button"
          role="tab"
          class="segmented__tab"
          :class="{ 'segmented__tab--active': String(monthCount) === option.value }"
          :aria-selected="String(monthCount) === option.value"
          :tabindex="String(monthCount) === option.value ? 0 : -1"
          @click="onMonthCountChange?.(Number(option.value))"
        >
          {{ option.label }}
        </button>
      </div>
      <div class="task-view-toolbar__dates">
        <button type="button" aria-label="Предыдущий период" @click="onPrevPeriod?.()">
          ←
        </button>
        <strong>{{ rangeLabel }}</strong>
        <button type="button" @click="onGoToday?.()">Сегодня</button>
        <button type="button" aria-label="Следующий период" @click="onNextPeriod?.()">
          →
        </button>
      </div>
    </div>

    <p v-if="isLoading" class="roadmap__status">Загрузка роадмапа...</p>
    <p v-if="isError" class="roadmap__status roadmap__status--error" role="alert">
      Не удалось загрузить задачи.
      <button type="button" class="board-filters__chip" @click="onRetry?.()">Повторить</button>
    </p>
    <p v-if="sprintsError" class="roadmap__status roadmap__status--error" role="alert">
      {{ sprintsError }}
      <button type="button" class="board-filters__chip" @click="onRetry?.()">Повторить</button>
    </p>
    <p v-if="truncationNote" class="roadmap__status">{{ truncationNote }}</p>

    <div v-if="showEmpty" class="roadmap__empty">
      <h2>Пока нет эпиков</h2>
      <p>Отметьте задачу как эпик в карточке — она появится здесь как дорожка.</p>
    </div>

    <div v-if="lanes.length > 0" class="roadmap__scroll">
      <div class="roadmap__grid" :style="{ '--roadmap-months': String(monthCount) }">
        <div class="roadmap__axis-spacer" aria-hidden="true" />
        <div
          class="roadmap__axis"
          role="row"
          :style="{ gridTemplateColumns: 'repeat(' + monthCount + ', minmax(0, 1fr))' }"
        >
          <div
            v-for="month in months"
            :key="month.key"
            class="roadmap__month"
            role="columnheader"
          >
            {{ month.label }}
          </div>
          <span
            v-if="todayPct != null"
            class="roadmap__today"
            :style="{ left: todayPct + '%' }"
            aria-hidden="true"
          />
        </div>

        <template v-for="lane in lanes" :key="lane.id">
          <RoadmapLane
            :id="lane.id"
            :title="lane.title"
            :progress-label="lane.progressLabel"
            :progress-pct="lane.progressPct"
            :assignee-name="lane.assigneeName"
            :priority="lane.priority"
            :placement="lane.placement"
            :today-pct="todayPct"
            :on-open="onOpenTask"
          />
        </template>
      </div>
    </div>

    <section v-if="undated.length > 0" class="roadmap__undated">
      <h2>Без дат</h2>
      <div>
        <button
          v-for="item in undated"
          :key="item.id"
          type="button"
          class="roadmap__undated-item"
          @click="onOpenTask(item.id)"
        >
          <strong>{{ item.title }}</strong>
          <span>{{ item.progressLabel }}</span>
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import RoadmapLane from './RoadmapLane.vue'

const props = defineProps({
  monthCount: { type: Number, required: true },
  rangeLabel: { type: String, default: '' },
  months: { type: Array, default: () => [] },
  todayPct: { type: Number, default: null },
  lanes: { type: Array, default: () => [] },
  undated: { type: Array, default: () => [] },
  epicCount: { type: Number, default: 0 },
  isLoading: { type: Boolean, default: false },
  isError: { type: Boolean, default: false },
  sprintsError: { type: String, default: '' },
  truncationNote: { type: String, default: '' },
  onMonthCountChange: { type: Function, default: null },
  onPrevPeriod: { type: Function, default: null },
  onNextPeriod: { type: Function, default: null },
  onGoToday: { type: Function, default: null },
  onOpenTask: { type: Function, required: true },
  onRetry: { type: Function, default: null },
})

const monthOptions = [
  { value: '3', label: '3 мес.' },
  { value: '6', label: '6 мес.' },
]

const showEmpty = computed(
  () =>
    !props.isLoading &&
    !props.isError &&
    props.lanes.length === 0 &&
    props.undated.length === 0,
)
</script>
