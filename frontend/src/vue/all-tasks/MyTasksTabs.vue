<template>
  <div class="my-tasks__tabs" role="tablist" aria-label="Секции моих задач">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      type="button"
      role="tab"
      :aria-selected="activeId === tab.id"
      :class="{ 'is-active': activeId === tab.id }"
      @click="onChange?.(tab.id)"
    >
      {{ tab.label }}
      <span v-if="tab.count != null" class="my-tasks__tab-count">{{ tab.count }}</span>
    </button>
  </div>
</template>

<script setup>
defineProps({
  tabs: { type: Array, required: true },
  activeId: { type: String, required: true },
  onChange: { type: Function, default: null },
})
</script>
