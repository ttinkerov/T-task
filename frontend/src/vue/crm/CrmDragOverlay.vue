<template>
  <div v-if="stageName" class="kanban-column kanban-column--dragging">
    <div class="kanban-column__header">
      <h3 class="kanban-column__title">{{ stageName }}</h3>
      <span class="kanban-column__count">{{ stageCount }}</span>
    </div>
  </div>
  <div v-else-if="dealTitle" class="kanban-task-card kanban-task-card--dragging crm-deal-card">
    <p class="kanban-task-card__title">{{ dealTitle }}</p>
  </div>
</template>

<script setup>
defineProps({
  stageName: { type: String, default: '' },
  stageCount: { type: [Number, String], default: 0 },
  dealTitle: { type: String, default: '' },
})
</script>
