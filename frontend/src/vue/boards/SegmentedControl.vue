<template>
  <div
    ref="listEl"
    class="segmented"
    :class="{ 'segmented--sm': size === 'sm' }"
    role="tablist"
    :aria-label="ariaLabel"
    :style="pillStyle"
    @keydown="onKeyDown"
  >
    <span class="segmented__pill" aria-hidden="true" />
    <button
      v-for="(option, index) in options"
      :key="option.value"
      :ref="(el) => setTabRef(option.value, el)"
      type="button"
      role="tab"
      class="segmented__tab"
      :class="{
        'segmented__tab--active': option.value === value,
        'segmented__tab--separator': showSeparator(index),
      }"
      :aria-selected="option.value === value"
      :tabindex="option.value === value ? 0 : -1"
      :disabled="option.disabled"
      @click="onChange?.(option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  options: { type: Array, default: () => [] },
  value: { type: String, default: '' },
  size: { type: String, default: 'md' },
  ariaLabel: { type: String, default: '' },
  onChange: { type: Function, default: null },
})

const listEl = ref(null)
const pill = ref({ left: 2, width: 0 })
const tabEls = new Map()
let resizeObserver = null

const pillStyle = computed(() => ({
  '--segmented-pill-left': `${pill.value.left}px`,
  '--segmented-pill-width': `${pill.value.width}px`,
}))

function setTabRef(value, el) {
  const node = Array.isArray(el) ? el[0] : el
  if (node) tabEls.set(value, node)
  else tabEls.delete(value)
}

function showSeparator(index) {
  if (index <= 0) return false
  const option = props.options[index]
  const prev = props.options[index - 1]
  return option?.value !== props.value && prev?.value !== props.value && !prev?.disabled
}

function measure() {
  const active = tabEls.get(props.value)
  if (!active) return
  const next = { left: active.offsetLeft, width: active.offsetWidth }
  if (pill.value.left === next.left && pill.value.width === next.width) return
  pill.value = next
}

function focusTab(index) {
  const option = props.options[index]
  if (!option || option.disabled) return
  tabEls.get(option.value)?.focus()
  props.onChange?.(option.value)
}

function onKeyDown(event) {
  const currentIndex = props.options.findIndex((option) => option.value === props.value)
  if (currentIndex < 0) return

  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
    event.preventDefault()
    for (let step = 1; step <= props.options.length; step += 1) {
      const next = (currentIndex + step) % props.options.length
      if (!props.options[next]?.disabled) {
        focusTab(next)
        return
      }
    }
  }

  if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
    event.preventDefault()
    for (let step = 1; step <= props.options.length; step += 1) {
      const next = (currentIndex - step + props.options.length) % props.options.length
      if (!props.options[next]?.disabled) {
        focusTab(next)
        return
      }
    }
  }

  if (event.key === 'Home') {
    event.preventDefault()
    const first = props.options.findIndex((option) => !option.disabled)
    if (first >= 0) focusTab(first)
  }

  if (event.key === 'End') {
    event.preventDefault()
    for (let index = props.options.length - 1; index >= 0; index -= 1) {
      if (!props.options[index]?.disabled) {
        focusTab(index)
        return
      }
    }
  }
}

onMounted(async () => {
  await nextTick()
  measure()
  if (typeof ResizeObserver === 'undefined' || !listEl.value) return
  resizeObserver = new ResizeObserver(() => measure())
  resizeObserver.observe(listEl.value)
  for (const button of tabEls.values()) resizeObserver.observe(button)
})

watch(
  () => [props.value, props.options.map((option) => option.value).join('\0')],
  async () => {
    await nextTick()
    measure()
  },
)

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})
</script>
