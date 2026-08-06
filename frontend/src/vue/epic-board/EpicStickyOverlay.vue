<template>
  <div class="epic-sticky epic-sticky--overlay" :style="{ background: background }">
    <span class="epic-sticky__title">{{ title }}</span>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, default: '' },
  background: { type: String, default: '' },
})
</script>
