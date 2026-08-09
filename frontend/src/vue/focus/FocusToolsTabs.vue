<template>
  <div class="focus-tools__tabs" role="tablist" aria-label="Инструменты фокуса">
    <button
      type="button"
      role="tab"
      id="focus-tab-pomodoro"
      :aria-selected="activeTool === 'pomodoro'"
      aria-controls="focus-panel-pomodoro"
      :class="{ 'focus-tools__tab--active': activeTool === 'pomodoro' }"
      @click="onSelect?.('pomodoro')"
    >
      Помодоро
    </button>
    <button
      type="button"
      role="tab"
      id="focus-tab-meditation"
      :aria-selected="activeTool === 'meditation'"
      aria-controls="focus-panel-meditation"
      :class="{ 'focus-tools__tab--active': activeTool === 'meditation' }"
      @click="onSelect?.('meditation')"
    >
      Медитации
    </button>
  </div>
</template>

<script setup>
defineProps({
  activeTool: { type: String, default: 'pomodoro' },
  onSelect: { type: Function, default: null },
})
</script>
