<template>
  <div class="task-drawer__header">
    <div>
      <p class="task-drawer__eyebrow">{{ stageName }}</p>
      <h2 class="task-drawer__heading">Сделка</h2>
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
  stageName: { type: String, default: '' },
  onClose: { type: Function, default: null },
})
</script>
