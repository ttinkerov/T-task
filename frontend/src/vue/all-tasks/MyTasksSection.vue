<template>
  <section
    v-if="tasks.length > 0 || emptyLabel"
    :class="['my-tasks__section', tone ? 'my-tasks__section--' + tone : '']"
    :aria-labelledby="'my-tasks-' + id"
  >
    <header class="my-tasks__section-head">
      <div>
        <h2 :id="'my-tasks-' + id">{{ title }}</h2>
        <p>{{ hint }}</p>
      </div>
      <span>{{ count != null ? count : tasks.length }}</span>
    </header>

    <p v-if="tasks.length === 0" class="my-tasks__empty">{{ emptyLabel }}</p>

    <ul v-else class="my-tasks__list" role="list">
      <li v-for="task in tasks" :key="task.id">
        <button type="button" class="my-tasks__row" @click="onOpenTask(task.id)">
          <span class="my-tasks__row-main">
            <strong>{{ task.title }}</strong>
            <small>
              {{ task.board.name }} · {{ task.column.name
              }}{{ task.priority ? ' · ' + (priorityLabels[task.priority] || task.priority) : '' }}
            </small>
          </span>
          <time :datetime="task.dueDate || undefined">{{ formatDue(task.dueDate) }}</time>
        </button>
      </li>
    </ul>
  </section>
</template>

<script setup>
defineProps({
  id: { type: String, required: true },
  title: { type: String, required: true },
  hint: { type: String, required: true },
  tasks: { type: Array, required: true },
  tone: { type: String, default: '' },
  emptyLabel: { type: String, default: '' },
  count: { type: Number, default: undefined },
  priorityLabels: { type: Object, required: true },
  onOpenTask: { type: Function, required: true },
})

function formatDue(dueDate) {
  if (!dueDate) return 'Без срока'
  return new Date(dueDate).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  })
}
</script>
