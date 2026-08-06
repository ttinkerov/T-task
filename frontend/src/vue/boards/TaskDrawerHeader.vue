<template>
  <div class="task-drawer__header">
    <div>
      <p class="task-drawer__eyebrow">{{ columnName }}</p>
      <h2 class="task-drawer__heading">Задача</h2>
    </div>
    <button
      type="button"
      class="dashboard-header__icon-btn"
      aria-label="Закрыть"
      @click="onClose?.()"
    >
      ×
    </button>
  </div>
</template>

<script setup>
defineProps({
  columnName: { type: String, default: '' },
  onClose: { type: Function, default: null },
})
</script>
