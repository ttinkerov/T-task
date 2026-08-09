<template>
  <div class="task-drawer__recurrence">
    <h3 class="task-drawer__recurrence-title">
      Повторение
      <FieldHint text="Автосоздание или перенос задачи по расписанию после завершения." />
    </h3>
    <p class="task-drawer__recurrence-hint">
      При переносе в «Готово» задача автоматически создастся снова или перенесётся на следующий
      срок.
    </p>

    <label class="task-drawer__field">
      <span class="task-drawer__label">Частота</span>
      <select class="glass-input" :value="recurrenceRule" @change="onRuleChange">
        <option v-for="option in ruleOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
    </label>

    <div v-if="recurrenceRule === 'WEEKLY'" class="task-drawer__field">
      <span class="task-drawer__label">Дни недели</span>
      <div class="task-drawer__weekdays">
        <button
          v-for="option in weekdayOptions"
          :key="option.value"
          type="button"
          :class="
            recurrenceWeekdays.includes(option.value)
              ? 'board-workload__toggle-btn board-workload__toggle-btn--active'
              : 'board-workload__toggle-btn'
          "
          @click="toggleWeekday(option.value)"
        >
          {{ option.label }}
        </button>
      </div>
    </div>

    <label v-if="recurrenceRule !== 'NONE'" class="task-drawer__field">
      <span class="task-drawer__label">
        После выполнения
        <FieldHint text="Дублировать — новая карточка. Перенести — та же задача с новым сроком." />
      </span>
      <select
        class="glass-input"
        :value="recurrenceAction"
        @change="onRecurrenceActionChange?.($event.target.value)"
      >
        <option v-for="option in actionOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
    </label>
  </div>
</template>

<script setup>
import FieldHint from './FieldHint.vue';

const props = defineProps({
  recurrenceRule: { type: String, default: 'NONE' },
  recurrenceAction: { type: String, default: 'DUPLICATE' },
  recurrenceWeekdays: { type: Array, default: () => [] },
  ruleOptions: { type: Array, default: () => [] },
  actionOptions: { type: Array, default: () => [] },
  weekdayOptions: { type: Array, default: () => [] },
  onRecurrenceRuleChange: { type: Function, default: null },
  onRecurrenceActionChange: { type: Function, default: null },
  onRecurrenceWeekdaysChange: { type: Function, default: null },
});

function onRuleChange(event) {
  const nextRule = event.target.value;
  props.onRecurrenceRuleChange?.(nextRule);
  if (nextRule !== 'WEEKLY') {
    props.onRecurrenceWeekdaysChange?.([]);
  }
}

function toggleWeekday(day) {
  const next = props.recurrenceWeekdays.includes(day)
    ? props.recurrenceWeekdays.filter((item) => item !== day)
    : [...props.recurrenceWeekdays, day].sort((a, b) => a - b);
  props.onRecurrenceWeekdaysChange?.(next);
}
</script>
