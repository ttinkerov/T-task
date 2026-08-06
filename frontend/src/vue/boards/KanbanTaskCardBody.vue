<template>
  <input
    type="checkbox"
    class="kanban-task-card__select"
    style="order: 0"
    :checked="selected"
    :aria-label="'Выбрать задачу ' + title"
    @click.stop
    @change="onSelectChange"
  />

  <button
    type="button"
    role="checkbox"
    class="tt-checkbox"
    :class="{ 'tt-checkbox--checked': isComplete }"
    style="order: 0"
    :aria-checked="isComplete ? 'true' : 'false'"
    :aria-label="isComplete ? 'Задача выполнена' : 'Отметить выполненной'"
    @click.stop="onCompleteClick"
  >
    <span class="tt-checkbox__mark" :class="{ 'tt-checkbox__mark--on': isComplete }" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.75">
        <path d="M20 6 9 17l-5-5" />
      </svg>
    </span>
  </button>

  <div class="min-w-0 flex-1" style="order: 3">
    <p class="kanban-task-card__title">{{ title }}</p>
    <p v-if="description" class="kanban-task-card__desc">{{ description }}</p>
    <KanbanTaskCardMeta v-bind="meta" />
  </div>
</template>

<script setup>
import KanbanTaskCardMeta from './KanbanTaskCardMeta.vue'

const props = defineProps({
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  selected: { type: Boolean, default: false },
  isComplete: { type: Boolean, default: false },
  meta: { type: Object, default: () => ({}) },
  onToggleSelect: { type: Function, default: null },
  onComplete: { type: Function, default: null },
})

function onSelectChange(event) {
  const native = event?.nativeEvent ?? event
  props.onToggleSelect?.({
    shiftKey: Boolean(native?.shiftKey),
    metaKey: Boolean(native?.metaKey),
    ctrlKey: Boolean(native?.ctrlKey),
  })
}

function onCompleteClick() {
  if (!props.isComplete) props.onComplete?.()
}
</script>
