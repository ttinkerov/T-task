<template>
  <section class="task-undated">
    <h3>Без дедлайна</h3>
    <div>
      <CompactTask
        v-for="item in tasks"
        :key="item.id"
        :item="item"
        :on-open-task="onOpenTask"
      />
    </div>
  </section>
</template>

<script setup>
import CompactTask from './TaskDisplayCompactTask.vue'

defineProps({
  tasks: { type: Array, default: () => [] },
  onOpenTask: { type: Function, default: null },
})
</script>
