<template>
  <p v-if="isEmpty" class="task-display-empty">В этом режиме пока нет подходящих задач.</p>

  <div v-else-if="mode === 'TABLE'" class="task-list-view">
    <table>
      <caption class="sr-only">Таблица задач с исполнителями, статусами и дедлайнами</caption>
      <thead>
        <tr>
          <th scope="col">Задача</th>
          <th scope="col">Статус</th>
          <th scope="col">Исполнитель</th>
          <th scope="col">Приоритет</th>
          <th scope="col">Дедлайн</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in tableRows" :key="row.id">
          <td>
            <button type="button" @click="onOpenTask?.(row.id)">{{ row.title }}</button>
          </td>
          <td>
            <span class="task-list-view__status">{{ row.columnName }}</span>
          </td>
          <td>{{ row.assignee }}</td>
          <td>{{ row.priority }}</td>
          <td>{{ row.dueLabel }}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div v-else-if="mode === 'WEEK'" class="task-week-view">
    <div class="task-week-view__days">
      <section
        v-for="day in weekDays"
        :key="day.key"
        :class="{ 'is-today': day.isToday }"
        :aria-label="day.ariaLabel"
      >
        <header>
          <span>{{ day.weekday }}</span>
          <strong>{{ day.dayNumber }}</strong>
        </header>
        <div>
          <CompactTask
            v-for="item in day.tasks"
            :key="item.id"
            :item="item"
            :on-open-task="onOpenTask"
          />
        </div>
      </section>
    </div>
    <UndatedTasks v-if="undated.length" :tasks="undated" :on-open-task="onOpenTask" />
  </div>

  <div v-else-if="mode === 'MONTH'" class="task-month-layout">
    <div class="task-month-view">
      <div class="task-month-view__weekdays" aria-hidden="true">
        <span v-for="day in weekdayLabels" :key="day">{{ day }}</span>
      </div>
      <div class="task-month-view__grid">
        <section
          v-for="day in monthDays"
          :key="day.key"
          :class="day.className || undefined"
          :aria-label="day.ariaLabel"
        >
          <time :datetime="day.key">{{ day.dayNumber }}</time>
          <div>
            <CompactTask
              v-for="item in day.tasks"
              :key="item.id"
              :item="item"
              :on-open-task="onOpenTask"
            />
          </div>
        </section>
      </div>
    </div>
    <UndatedTasks v-if="undated.length" :tasks="undated" :on-open-task="onOpenTask" />
  </div>

  <div v-else class="task-gantt-view">
    <div class="task-gantt-view__scroll">
      <div class="task-gantt-view__header">
        <strong>Задача</strong>
        <div>
          <time
            v-for="day in timelineDays"
            :key="day.key"
            :datetime="day.key"
            :class="{ 'is-today': day.isToday }"
          >
            <span>{{ day.weekday }}</span>
            {{ day.dayNumber }}
          </time>
        </div>
      </div>
      <div v-for="row in timelineRows" :key="row.id" class="task-gantt-view__row">
        <button type="button" @click="onOpenTask?.(row.id)">
          <strong>{{ row.title }}</strong>
          <small>{{ row.columnName }}</small>
        </button>
        <div class="task-gantt-view__track">
          <button
            type="button"
            class="task-gantt-view__bar"
            :class="row.barClass"
            :style="{ gridColumn: row.gridColumn }"
            :title="row.barTitle"
            @click="onOpenTask?.(row.id)"
          >
            {{ row.title }}
          </button>
        </div>
      </div>
    </div>
    <p
      v-if="timelineRows.length === 0 && undated.length === 0"
      class="task-display-empty"
    >
      В этом режиме пока нет подходящих задач.
    </p>
    <UndatedTasks v-if="undated.length" :tasks="undated" :on-open-task="onOpenTask" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import CompactTask from './TaskDisplayCompactTask.vue'
import UndatedTasks from './TaskDisplayUndated.vue'

const props = defineProps({
  mode: { type: String, required: true },
  tableRows: { type: Array, default: () => [] },
  weekDays: { type: Array, default: () => [] },
  monthDays: { type: Array, default: () => [] },
  weekdayLabels: { type: Array, default: () => ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] },
  timelineDays: { type: Array, default: () => [] },
  timelineRows: { type: Array, default: () => [] },
  undated: { type: Array, default: () => [] },
  onOpenTask: { type: Function, default: null },
})

const isEmpty = computed(() => props.mode === 'TABLE' && props.tableRows.length === 0)
</script>
