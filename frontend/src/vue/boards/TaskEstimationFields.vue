<template>
  <div class="task-drawer__estimation">
    <div class="task-drawer__grid">
      <label class="task-drawer__field">
        <span class="task-drawer__label">
          Приоритет
          <FieldHint text="Насколько срочно взяться за задачу относительно остальных." />
        </span>
        <select
          class="glass-input"
          :value="priority"
          @change="onPriorityChange?.($event.target.value)"
        >
          <option v-for="option in priorityOptions" :key="option.label" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </label>

      <label class="task-drawer__field">
        <span class="task-drawer__label">
          Очки (SP)
          <FieldHint
            text="Очки сложности (не часы). Нужны для скорости спринта."
          />
        </span>
        <select
          class="glass-input"
          :value="complexity"
          @change="onComplexityChange?.(parseOptionalNumber($event.target.value))"
        >
          <option v-for="option in complexityOptions" :key="option.label" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </label>
    </div>

    <div class="task-drawer__grid">
      <label class="task-drawer__field">
        <span class="task-drawer__label">
          Оценка времени
          <FieldHint text="Сколько времени планируете потратить. Для сравнения с фактом." />
        </span>
        <select
          class="glass-input"
          :value="timeEstimateMinutes"
          @change="onTimeEstimateChange?.(parseOptionalNumber($event.target.value))"
        >
          <option v-for="option in timeEstimateOptions" :key="option.label" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </label>

      <label class="task-drawer__field">
        <span class="task-drawer__label">
          Фактическое время
          <FieldHint text="Сколько реально ушло. Можно заполнить вручную или таймером." />
        </span>
        <select
          class="glass-input"
          :value="actualMinutes"
          @change="onActualMinutesChange?.(parseOptionalNumber($event.target.value))"
        >
          <option
            v-for="option in timeEstimateOptions"
            :key="'actual-' + option.label"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </label>
    </div>

    <label class="task-drawer__field">
      <span class="task-drawer__label">
        Дедлайн
        <FieldHint text="Крайний срок. Просроченные задачи подсвечиваются на доске." />
      </span>
      <input
        type="date"
        class="glass-input"
        :value="dueDate"
        @input="onDueDateChange?.($event.target.value)"
      />
    </label>
  </div>
</template>

<script setup>
import FieldHint from './FieldHint.vue';

defineProps({
  priority: { type: String, default: '' },
  complexity: { type: [Number, String], default: '' },
  timeEstimateMinutes: { type: [Number, String], default: '' },
  actualMinutes: { type: [Number, String], default: '' },
  dueDate: { type: String, default: '' },
  priorityOptions: { type: Array, default: () => [] },
  complexityOptions: { type: Array, default: () => [] },
  timeEstimateOptions: { type: Array, default: () => [] },
  onPriorityChange: { type: Function, default: null },
  onComplexityChange: { type: Function, default: null },
  onTimeEstimateChange: { type: Function, default: null },
  onActualMinutesChange: { type: Function, default: null },
  onDueDateChange: { type: Function, default: null },
});

function parseOptionalNumber(value) {
  return value === '' ? '' : Number(value);
}
</script>
