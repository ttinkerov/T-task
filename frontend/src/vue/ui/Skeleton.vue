<template>
  <div
    v-if="variant"
    :class="['tt-skeleton', 'tt-skeleton--' + variant, className].filter(Boolean).join(' ')"
    aria-hidden="true"
  />

  <div v-else class="flex gap-3 overflow-hidden" role="status" aria-label="Загрузка доски">
    <div
      v-for="column in 3"
      :key="column"
      class="flex w-[300px] shrink-0 flex-col gap-2 rounded-xl border border-[var(--tt-border-subtle)] bg-[var(--tt-surface)] p-3"
    >
      <div class="tt-skeleton tt-skeleton--title" aria-hidden="true" />
      <div class="tt-skeleton tt-skeleton--card" aria-hidden="true" />
      <div class="tt-skeleton tt-skeleton--card" aria-hidden="true" />
      <div class="tt-skeleton tt-skeleton--card h-16" aria-hidden="true" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  variant: { type: String, default: '' },
  className: { type: String, default: '' },
});
</script>
