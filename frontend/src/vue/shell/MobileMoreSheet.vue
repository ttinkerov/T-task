<template>
  <div v-if="open" class="mobile-more" role="dialog" aria-label="Ещё разделы">
    <button type="button" class="mobile-more__backdrop" @click="onClose?.()" />
    <div class="mobile-more__sheet">
      <div class="mobile-more__head">
        <strong>Разделы</strong>
        <button type="button" class="dashboard-header__icon-btn" @click="onClose?.()">
          <ShellIcon name="chevron-right" :size="16" />
        </button>
      </div>
      <div class="mobile-more__links">
        <a
          v-for="item in items"
          :key="item.href"
          :href="item.href"
          class="mobile-more__link"
          :class="{ 'is-active': item.active }"
          @click="onClose?.()"
        >
          <ShellIcon :name="item.iconKey" :size="16" />
          {{ item.label }}
          <ShellIcon name="chevron-left" :size="14" class="opacity-0" />
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
import ShellIcon from './ShellIcon.vue'

defineProps({
  open: { type: Boolean, default: false },
  items: { type: Array, default: () => [] },
  onClose: { type: Function, default: null },
})
</script>
