<template>
  <div class="task-view-toolbar">
    <div class="task-view-toolbar__lead">
      <SegmentedControl
        aria-label="Вид задач"
        :options="viewOptions"
        :value="mode"
        :on-change="onModeChange"
      />
    </div>

    <div class="task-view-toolbar__controls">
      <SegmentedControl
        v-if="showCalendarRange"
        size="sm"
        aria-label="Период календаря"
        :options="calendarRangeOptions"
        :value="calendarRange"
        :on-change="onCalendarRangeChange"
      />

      <div v-if="hasDateNavigation" class="task-view-toolbar__dates">
        <button type="button" aria-label="Предыдущий период" @click="onPrev?.()">‹</button>
        <button type="button" @click="onToday?.()">Сегодня</button>
        <strong>{{ periodLabel }}</strong>
        <button type="button" aria-label="Следующий период" @click="onNext?.()">›</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import SegmentedControl from './SegmentedControl.vue'

defineProps({
  mode: { type: String, required: true },
  viewOptions: { type: Array, default: () => [] },
  calendarRange: { type: String, default: 'WEEK' },
  calendarRangeOptions: { type: Array, default: () => [] },
  showCalendarRange: { type: Boolean, default: false },
  hasDateNavigation: { type: Boolean, default: false },
  periodLabel: { type: String, default: '' },
  onModeChange: { type: Function, default: null },
  onCalendarRangeChange: { type: Function, default: null },
  onPrev: { type: Function, default: null },
  onNext: { type: Function, default: null },
  onToday: { type: Function, default: null },
})
</script>
