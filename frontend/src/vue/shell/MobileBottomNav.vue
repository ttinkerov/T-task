<template>
  <nav class="mobile-nav" aria-label="Мобильная навигация">
    <a
      v-for="item in items"
      :key="item.href"
      :href="item.href"
      class="mobile-nav__item"
      :class="{ 'mobile-nav__item--active': item.active }"
      :aria-current="item.active ? 'page' : undefined"
    >
      <ShellIcon :name="item.iconKey" :size="18" />
      {{ item.label }}
    </a>
    <button
      v-if="showMore"
      type="button"
      class="mobile-nav__item"
      :class="{ 'mobile-nav__item--active': moreActive }"
      @click="onMore?.()"
    >
      <ShellIcon name="more" :size="18" />
      Ещё
    </button>
  </nav>
</template>

<script setup>
import ShellIcon from './ShellIcon.vue'

defineProps({
  items: { type: Array, default: () => [] },
  showMore: { type: Boolean, default: false },
  moreActive: { type: Boolean, default: false },
  onMore: { type: Function, default: null },
})
</script>
