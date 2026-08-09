<template>
  <aside class="app-sidebar" aria-label="Боковая навигация">
    <div class="app-sidebar__brand">
      <BrandLogo href="/dashboard" />
      <button
        type="button"
        class="app-sidebar__collapse"
        :aria-label="collapsed ? 'Развернуть меню' : 'Свернуть меню'"
        :title="collapsed ? 'Развернуть' : 'Свернуть'"
        @click="onToggleCollapse?.()"
      >
        <ShellIcon :name="collapsed ? 'panel-open' : 'panel-close'" :size="16" />
      </button>
    </div>

    <nav class="app-sidebar__nav">
      <div
        v-for="group in visibleGroups"
        :key="group.id"
        class="app-sidebar__group"
        :class="{
          'app-sidebar__group--collapsible': group.collapsible,
          'app-sidebar__group--open': group.open,
        }"
      >
        <button
          v-if="group.collapsible && !collapsed"
          type="button"
          class="app-sidebar__group-toggle"
          :aria-expanded="group.open"
          :aria-controls="'nav-group-' + group.id"
          @click="onToggleGroup?.(group.id)"
        >
          <span class="app-sidebar__group-label">{{ group.label }}</span>
          <ShellIcon name="chevron-down" class="app-sidebar__group-chevron" :size="14" :stroke-width="2" />
        </button>
        <p v-else class="app-sidebar__group-label">{{ group.label }}</p>

        <div
          :id="'nav-group-' + group.id"
          class="app-sidebar__links"
          :hidden="!group.open"
          :role="group.collapsible ? 'region' : undefined"
          :aria-label="group.collapsible ? group.label : undefined"
        >
          <a
            v-for="item in group.items"
            :key="group.id + '-' + item.href"
            :href="item.href"
            class="app-sidebar__link"
            :class="{ 'app-sidebar__link--active': item.active }"
            :aria-current="item.active ? 'page' : undefined"
            :title="collapsed ? item.label : undefined"
          >
            <ShellIcon :name="item.iconKey" :size="17" />
            <span>{{ item.label }}</span>
          </a>
        </div>
      </div>
    </nav>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import BrandLogo from '../marketing/BrandLogo.vue'
import ShellIcon from './ShellIcon.vue'

const props = defineProps({
  groups: { type: Array, default: () => [] },
  collapsed: { type: Boolean, default: false },
  onToggleCollapse: { type: Function, default: null },
  onToggleGroup: { type: Function, default: null },
})

const visibleGroups = computed(() =>
  props.groups
    .map((group) => ({
      ...group,
      items: (group.items || []).filter((item) => !item.hidden),
    }))
    .filter((group) => group.items.length > 0),
)
</script>
