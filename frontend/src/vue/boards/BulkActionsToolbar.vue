<template>
  <div class="bulk-actions-toolbar" role="toolbar" aria-label="Массовые действия">
    <strong aria-live="polite">{{ count }} выбрано</strong>

    <p v-if="loadError" class="bulk-actions-toolbar__error" role="alert">
      {{ loadError }}
      <button type="button" class="board-filters__chip" :disabled="pending" @click="onRetry?.()">
        Повторить
      </button>
    </p>

    <select
      aria-label="Исполнитель"
      :disabled="pending"
      :value="assigneeValue"
      @change="onAssigneeChange"
    >
      <option value="">Исполнитель…</option>
      <option value="__none__">Без исполнителя</option>
      <option v-for="member in members" :key="member.userId" :value="member.userId">
        {{ member.name }}
      </option>
    </select>

    <select
      aria-label="Приоритет"
      :disabled="pending"
      :value="priorityValue"
      @change="onPriorityChange"
    >
      <option value="">Приоритет…</option>
      <option value="__none__">Без приоритета</option>
      <option v-for="option in priorityOptions" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>

    <select aria-label="Спринт" :disabled="pending" :value="sprintValue" @change="onSprintChange">
      <option value="">Спринт…</option>
      <option value="__none__">Без спринта</option>
      <option v-for="sprint in sprints" :key="sprint.id" :value="sprint.id">
        {{ sprint.name }}
      </option>
    </select>

    <select
      aria-label="Переместить в колонку"
      :disabled="pending"
      :value="columnValue"
      @change="onColumnChange"
    >
      <option value="">В колонку…</option>
      <option v-for="column in columns" :key="column.id" :value="column.id">
        {{ column.name }}
      </option>
    </select>

    <button type="button" class="btn-ghost" :disabled="pending" @click="onClear?.()">
      Сбросить
    </button>

    <span v-if="error" class="bulk-actions-toolbar__error" role="alert">{{ error }}</span>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  count: { type: Number, default: 0 },
  members: { type: Array, default: () => [] },
  sprints: { type: Array, default: () => [] },
  columns: { type: Array, default: () => [] },
  priorityOptions: { type: Array, default: () => [] },
  pending: { type: Boolean, default: false },
  error: { type: String, default: '' },
  loadError: { type: String, default: '' },
  onApply: { type: Function, default: null },
  onClear: { type: Function, default: null },
  onRetry: { type: Function, default: null },
})

const assigneeValue = ref('')
const priorityValue = ref('')
const sprintValue = ref('')
const columnValue = ref('')

async function applyAndReset(patch, resetRef) {
  try {
    await props.onApply?.(patch)
    resetRef.value = ''
  } catch {
    /* keep select value; error shown via props.error */
  }
}

function onAssigneeChange(event) {
  const value = event.target.value
  if (!value) return
  void applyAndReset({ assigneeId: value === '__none__' ? null : value }, assigneeValue)
}

function onPriorityChange(event) {
  const value = event.target.value
  if (!value) return
  void applyAndReset({ priority: value === '__none__' ? null : value }, priorityValue)
}

function onSprintChange(event) {
  const value = event.target.value
  if (!value) return
  void applyAndReset({ sprintId: value === '__none__' ? null : value }, sprintValue)
}

function onColumnChange(event) {
  const value = event.target.value
  if (!value) return
  void applyAndReset({ columnId: value }, columnValue)
}
</script>
