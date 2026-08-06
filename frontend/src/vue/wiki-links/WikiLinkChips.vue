<template>
  <div v-if="links.length > 0" class="wiki-link-chips" aria-label="Ссылки на задачи">
    <button
      v-for="link in links"
      :key="link.taskId"
      type="button"
      class="wiki-link-chip"
      @click="onOpenTask?.(link.taskId)"
    >
      [[{{ link.title }}]]
    </button>
  </div>
</template>

<script setup>
defineProps({
  links: { type: Array, default: () => [] },
  onOpenTask: { type: Function, default: null },
})
</script>
