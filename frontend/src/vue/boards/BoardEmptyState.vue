<template>
  <div class="empty-state" :class="className" role="status">
    <span v-if="icon" class="empty-state__icon" aria-hidden="true">
      <svg
        v-if="icon === 'kanban'"
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.75"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <path d="M8 7v10" />
        <path d="M12 7v5" />
        <path d="M16 7v8" />
      </svg>
      <svg
        v-else-if="icon === 'layout-list'"
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.75"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M3 12h.01" />
        <path d="M3 18h.01" />
        <path d="M3 6h.01" />
        <path d="M8 12h13" />
        <path d="M8 18h13" />
        <path d="M8 6h13" />
      </svg>
      <svg
        v-else-if="icon === 'plus'"
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.75"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M5 12h14" />
        <path d="M12 5v14" />
      </svg>
    </span>
    <h2 class="empty-state__title">{{ title }}</h2>
    <p class="empty-state__description">{{ description }}</p>
    <button
      type="button"
      class="btn-primary empty-state__action"
      :disabled="actionDisabled || actionPending"
      @click="onAction?.()"
    >
      {{ actionPending ? 'Создание…' : actionLabel }}
    </button>
  </div>
</template>

<script setup>
defineProps({
  icon: { type: String, default: '' },
  title: { type: String, required: true },
  description: { type: String, required: true },
  actionLabel: { type: String, required: true },
  actionPending: { type: Boolean, default: false },
  actionDisabled: { type: Boolean, default: false },
  className: { type: String, default: '' },
  onAction: { type: Function, default: null },
})
</script>
