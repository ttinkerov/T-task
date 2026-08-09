<template>
  <section class="task-subtasks" aria-labelledby="task-subtasks-title">
    <div class="task-subtasks__header">
      <h3 id="task-subtasks-title" class="task-drawer__section-title">
        Подзадачи
        <FieldHint text="Мелкие шаги внутри задачи. Прогресс считается по отмеченным пунктам." />
      </h3>
      <span>{{ completed }}/{{ subtasks.length }}</span>
    </div>

    <p v-if="isLoading" role="status">Загрузка подзадач...</p>

    <div v-else-if="loadError" role="alert">
      <p class="text-sm text-red-400">{{ loadError }}</p>
      <button type="button" class="btn-ghost" @click="onRetryLoad?.()">Повторить</button>
    </div>

    <ul v-else class="task-subtasks__list" role="list">
      <li v-for="subtask in subtasks" :key="subtask.id">
        <label>
          <input
            type="checkbox"
            :checked="subtask.completed"
            :disabled="updatePending"
            @change="onToggle?.(subtask.id, $event.target.checked)"
          />
          <span :class="{ 'is-done': subtask.completed }">{{ subtask.title }}</span>
        </label>
        <button
          type="button"
          :aria-label="'Удалить подзадачу ' + subtask.title"
          :disabled="deletePending"
          @click="onDelete?.(subtask.id)"
        >
          ×
        </button>
      </li>
    </ul>

    <form v-if="!loadError" class="task-subtasks__create" @submit.prevent="submit">
      <input
        v-model="title"
        placeholder="Новая подзадача"
        maxlength="200"
        aria-label="Название подзадачи"
      />
      <button type="submit" :disabled="createPending || !title.trim()">Добавить</button>
    </form>

    <p v-if="actionError" class="text-sm text-red-400" role="alert">{{ actionError }}</p>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import FieldHint from './FieldHint.vue'

const props = defineProps({
  subtasks: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false },
  loadError: { type: String, default: '' },
  actionError: { type: String, default: '' },
  createPending: { type: Boolean, default: false },
  updatePending: { type: Boolean, default: false },
  deletePending: { type: Boolean, default: false },
  onRetryLoad: { type: Function, default: null },
  onToggle: { type: Function, default: null },
  onDelete: { type: Function, default: null },
  onCreate: { type: Function, default: null },
})

const title = ref('')
const completed = computed(() => props.subtasks.filter((item) => item.completed).length)

async function submit() {
  const trimmed = title.value.trim()
  if (!trimmed) return
  try {
    await props.onCreate?.(trimmed)
    title.value = ''
  } catch {
  }
}
</script>
