<template>
  <section class="task-subtasks" aria-labelledby="deal-tasks-title">
    <div class="task-subtasks__header">
      <h3 id="deal-tasks-title">Задачи</h3>
      <span>{{ links.length }}</span>
    </div>

    <p v-if="isLoading" role="status">Загрузка связей...</p>

    <p v-else-if="links.length === 0" class="task-tags__empty">Нет связанных задач</p>

    <ul v-else class="task-subtasks__list" role="list">
      <li v-for="link in links" :key="link.taskId">
        <span :class="{ 'is-done': link.completed }">
          {{ link.title }}
          <small class="task-deals__meta"> · {{ link.meta }}</small>
        </span>
        <button
          type="button"
          :aria-label="'Отвязать задачу ' + link.title"
          :disabled="unlinkPending"
          @click="onUnlink?.(link.taskId)"
        >
          ×
        </button>
      </li>
    </ul>

    <form class="task-subtasks__create" @submit.prevent="submit">
      <select v-model="taskId" aria-label="Задача">
        <option value="">Выберите задачу</option>
        <option v-for="task in taskOptions" :key="task.id" :value="task.id">
          {{ task.label }}
        </option>
      </select>
      <button type="submit" :disabled="!taskId || linkPending">Связать</button>
    </form>

    <p v-if="error" class="text-sm text-red-400" role="alert">{{ error }}</p>
  </section>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  links: { type: Array, default: () => [] },
  taskOptions: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false },
  linkPending: { type: Boolean, default: false },
  unlinkPending: { type: Boolean, default: false },
  error: { type: String, default: '' },
  onLink: { type: Function, default: null },
  onUnlink: { type: Function, default: null },
})

const taskId = ref('')

async function submit() {
  if (!taskId.value) return
  try {
    await props.onLink?.(taskId.value)
    taskId.value = ''
  } catch {
    /* ignore */
  }
}
</script>
