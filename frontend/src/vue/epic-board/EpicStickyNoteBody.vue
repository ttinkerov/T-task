<template>
  <span class="epic-sticky__title">{{ title }}</span>
  <span v-if="assigneeName" class="epic-sticky__meta">{{ assigneeName }}</span>
</template>

<script setup>
defineProps({
  title: { type: String, default: '' },
  assigneeName: { type: String, default: '' },
})
</script>
