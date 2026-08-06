<template>
  <button type="button" class="roadmap__lane-meta" @click="onOpen(id)">
    <strong>{{ title }}</strong>
    <span>{{ metaLine }}</span>
  </button>
  <div class="roadmap__track">
    <span
      v-if="todayPct != null"
      class="roadmap__today"
      :style="{ left: todayPct + '%' }"
      aria-hidden="true"
    />
    <button
      v-if="placement"
      type="button"
      :class="barClass"
      :style="{
        left: placement.leftPct + '%',
        width: placement.widthPct + '%',
      }"
      :title="title"
      @click="onOpen(id)"
    >
      <span class="roadmap__bar-fill" :style="{ width: progressPct + '%' }" aria-hidden="true" />
      <span class="roadmap__bar-label">{{ title }}</span>
    </button>
    <span v-else class="roadmap__out-of-range">Вне периода</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  id: { type: String, required: true },
  title: { type: String, required: true },
  progressLabel: { type: String, required: true },
  progressPct: { type: Number, required: true },
  assigneeName: { type: String, default: null },
  priority: { type: String, default: null },
  placement: { type: Object, default: null },
  todayPct: { type: Number, default: null },
  onOpen: { type: Function, required: true },
})

const metaLine = computed(() => {
  if (props.assigneeName) return props.progressLabel + ' · ' + props.assigneeName
  return props.progressLabel
})

const barClass = computed(() => {
  const base = 'roadmap__bar'
  if (!props.priority) return base
  return base + ' roadmap__bar--priority-' + props.priority
})
</script>
