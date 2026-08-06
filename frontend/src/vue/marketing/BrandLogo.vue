<template>
  <component
    :is="href ? 'a' : 'span'"
    :href="href || undefined"
    :class="rootClass"
    :aria-label="markOnly ? 'T-task' : undefined"
  >
    <span class="tt-brand-logo__mark">
      <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect width="32" height="32" rx="9" fill="#BE185D" />
        <rect x="8" y="9" width="4.5" height="14" rx="1.5" fill="white" fill-opacity="0.95" />
        <rect x="13.75" y="9" width="4.5" height="10" rx="1.5" fill="white" fill-opacity="0.75" />
        <rect x="19.5" y="9" width="4.5" height="12" rx="1.5" fill="white" fill-opacity="0.55" />
      </svg>
    </span>
    <span v-if="!markOnly" class="tt-brand-logo__text">T-task</span>
  </component>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  href: { type: String, default: '/' },
  className: { type: String, default: '' },
  markOnly: { type: Boolean, default: false },
})

const rootClass = computed(() => {
  const parts = ['tt-brand-logo']
  if (props.markOnly) parts.push('tt-brand-logo--mark-only')
  if (props.className) parts.push(props.className)
  return parts.join(' ')
})
</script>
