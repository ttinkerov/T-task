<template>
  <button
    type="button"
    class="compact-view-task"
    :class="item.priorityClass"
    @click="onOpenTask?.(item.id)"
  >
    <strong>{{ item.title }}</strong>
    <small>{{ item.subtitle }}</small>
  </button>
</template>

<script setup>
defineProps({
  item: { type: Object, required: true },
  onOpenTask: { type: Function, default: null },
})
</script>
