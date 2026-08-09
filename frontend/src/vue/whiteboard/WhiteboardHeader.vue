<template>
  <div class="flex shrink-0 items-center justify-between gap-3 border-b border-border/60 px-4 py-2">
    <div>
      <h1 class="text-sm font-medium text-foreground">Доска</h1>
      <p class="text-xs text-muted-foreground">Рисование и схемы для команды · без realtime</p>
    </div>
    <p
      class="text-xs"
      :class="statusError ? 'text-destructive' : 'text-muted-foreground'"
      role="status"
      aria-live="polite"
    >
      {{ statusText }}
    </p>
  </div>
</template>

<script setup>
defineProps({
  statusText: { type: String, default: '' },
  statusError: { type: Boolean, default: false },
})
</script>
