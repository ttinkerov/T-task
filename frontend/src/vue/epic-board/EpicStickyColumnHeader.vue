<template>
  <header class="epic-sticky-column__header">
    <h3>{{ name }}</h3>
    <span>{{ count }}</span>
  </header>
</template>

<script setup>
defineProps({
  name: { type: String, default: '' },
  count: { type: Number, default: 0 },
})
</script>
