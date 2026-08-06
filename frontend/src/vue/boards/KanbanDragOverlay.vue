<template>
  <div v-if="columnName" class="kanban-column kanban-column--overlay">
    <header class="kanban-column__header">
      <h3>{{ columnName }}</h3>
    </header>
  </div>
  <div v-else-if="taskTitle" class="kanban-task-card kanban-task-card--dragging kanban-task">
    <p class="kanban-task-card__title">{{ taskTitle }}</p>
  </div>
</template>

<script setup>
defineProps({
  columnName: { type: String, default: '' },
  taskTitle: { type: String, default: '' },
})
</script>
