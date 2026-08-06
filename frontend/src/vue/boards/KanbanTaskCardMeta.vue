<template>
  <div v-if="visible" class="kanban-task-meta">
    <span
      v-for="tag in tags"
      :key="tag.id"
      class="tag-chip"
      :style="{ background: tag.color + '22', color: tag.color, borderColor: tag.color }"
    >
      <i :style="{ background: tag.color }" />
      {{ tag.name }}
    </span>

    <span v-if="subtaskTotal > 0" class="kanban-task-chip">
      {{ subtaskCompleted }}/{{ subtaskTotal }} шагов
    </span>

    <span v-if="overdueLabel" :class="overdueChipClass">{{ overdueLabel }}</span>

    <span v-if="recurrenceLabel" class="kanban-task-chip kanban-task-chip--recurrence">
      {{ recurrenceLabel }}
    </span>

    <span v-if="assigneeName" class="kanban-task-chip">{{ assigneeName }}</span>

    <span
      v-if="priorityLabel"
      :class="'kanban-task-chip kanban-task-chip--priority-' + priority"
    >
      {{ priorityLabel }}
    </span>

    <span v-if="complexity" class="kanban-task-chip">{{ complexity }} SP</span>

    <span v-if="estimateLabel" class="kanban-task-chip kanban-task-chip--estimate">
      {{ estimateLabel }}
    </span>

    <span v-if="actualLabel" class="kanban-task-chip kanban-task-chip--actual">
      факт {{ actualLabel }}
    </span>

    <span v-if="timerRunning" class="kanban-task-chip kanban-task-chip--timer">
      таймер запущен
    </span>

    <span v-if="completed" class="kanban-task-chip kanban-task-chip--complete">выполнено</span>

    <span v-if="dueLabel" :class="dueChipClass">{{ dueLabel }}</span>

    <span
      v-for="chip in customFieldChips"
      :key="chip.id"
      class="kanban-task-chip kanban-task-chip--custom"
    >
      {{ chip.label }}
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  tags: { type: Array, default: () => [] },
  subtaskTotal: { type: Number, default: 0 },
  subtaskCompleted: { type: Number, default: 0 },
  overdueLabel: { type: String, default: '' },
  agingLevel: { type: String, default: 'none' },
  recurrenceLabel: { type: String, default: '' },
  assigneeName: { type: String, default: '' },
  priority: { type: String, default: '' },
  priorityLabel: { type: String, default: '' },
  complexity: { type: [String, Number], default: '' },
  estimateLabel: { type: String, default: '' },
  actualLabel: { type: String, default: '' },
  timerRunning: { type: Boolean, default: false },
  completed: { type: Boolean, default: false },
  dueLabel: { type: String, default: '' },
  isOverdue: { type: Boolean, default: false },
  customFieldChips: { type: Array, default: () => [] },
})

const visible = computed(
  () =>
    Boolean(props.priority) ||
    Boolean(props.complexity) ||
    Boolean(props.estimateLabel) ||
    Boolean(props.actualLabel) ||
    props.timerRunning ||
    props.completed ||
    Boolean(props.dueLabel) ||
    Boolean(props.recurrenceLabel) ||
    Boolean(props.overdueLabel) ||
    props.tags.length > 0 ||
    props.subtaskTotal > 0 ||
    props.customFieldChips.length > 0 ||
    Boolean(props.assigneeName),
)

const overdueChipClass = computed(() =>
  props.agingLevel === 'due-today' || props.agingLevel === 'due-soon'
    ? 'kanban-task-chip kanban-task-chip--due-soon'
    : 'kanban-task-chip kanban-task-chip--overdue',
)

const dueChipClass = computed(() =>
  props.isOverdue ? 'kanban-task-chip kanban-task-chip--overdue-date' : 'kanban-task-chip',
)
</script>
