<template>
  <div
    v-if="open"
    class="cmdk-overlay"
    role="presentation"
    @click="onClose?.()"
  >
    <div
      class="cmdk"
      role="dialog"
      aria-modal="true"
      aria-label="Быстрый переход"
      @click.stop
    >
      <div class="cmdk__search">
        <ShellIcon name="search" :size="16" />
        <input
          ref="inputEl"
          :value="query"
          placeholder="Найти задачу, сделку или страницу…"
          aria-label="Быстрый переход"
          @input="onQueryChange?.($event.target.value)"
        />
        <kbd>esc</kbd>
      </div>

      <div className="cmdk__list" role="listbox">
        <p v-if="searchError" class="cmdk__empty" role="alert">{{ searchError }}</p>
        <p v-else-if="groups.length === 0" class="cmdk__empty">Ничего не найдено</p>
        <template v-else>
          <div v-for="group in groups" :key="group.name" class="cmdk__group">
            <p class="cmdk__group-label">{{ group.name }}</p>
            <button
              v-for="item in group.items"
              :key="item.id"
              type="button"
              role="option"
              :aria-selected="item.index === activeIndex"
              class="cmdk__item"
              :class="{ 'cmdk__item--active': item.index === activeIndex }"
              @mouseenter="onActiveChange?.(item.index)"
              @click="onSelect?.(item.id)"
            >
              <ShellIcon :name="item.iconKey || 'layout'" :size="16" />
              <span class="cmdk__item-label">
                <span>{{ item.label }}</span>
                <small v-if="item.hint" class="cmdk__item-hint">{{ item.hint }}</small>
              </span>
              <ShellIcon name="arrow-right" :size="14" class="cmdk__item-arrow" />
            </button>
          </div>
        </template>
      </div>

      <footer class="cmdk__footer">
        <span><kbd>↑↓</kbd> навигация</span>
        <span><kbd>↵</kbd> открыть</span>
        <span><kbd>esc</kbd> закрыть</span>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { nextTick, ref, watch } from 'vue'
import ShellIcon from './ShellIcon.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  query: { type: String, default: '' },
  groups: { type: Array, default: () => [] },
  activeIndex: { type: Number, default: 0 },
  searchError: { type: String, default: '' },
  onClose: { type: Function, default: null },
  onQueryChange: { type: Function, default: null },
  onActiveChange: { type: Function, default: null },
  onSelect: { type: Function, default: null },
})

const inputEl = ref(null)

watch(
  () => props.open,
  async (next) => {
    if (!next) return
    await nextTick()
    inputEl.value?.focus()
  },
)
</script>
