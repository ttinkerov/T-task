<template>
  <div class="analytics-filters" style="margin-bottom: 1rem">
    <label class="analytics-filters__group">
      <span class="analytics-filters__label">Действие</span>
      <select
        class="board-filters__select"
        :value="action"
        @change="onUpdateAction?.($event.target.value)"
      >
        <option value="">Все</option>
        <option v-for="option in actionOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
    </label>

    <label class="analytics-filters__group">
      <span class="analytics-filters__label">С</span>
      <input
        type="date"
        class="glass-input"
        :value="from"
        @change="onUpdateFrom?.($event.target.value)"
      />
    </label>

    <label class="analytics-filters__group">
      <span class="analytics-filters__label">По</span>
      <input
        type="date"
        class="glass-input"
        :value="to"
        @change="onUpdateTo?.($event.target.value)"
      />
    </label>
  </div>
</template>

<script setup>
defineProps({
  action: { type: String, default: '' },
  from: { type: String, default: '' },
  to: { type: String, default: '' },
  actionOptions: { type: Array, required: true },
  onUpdateAction: { type: Function, default: null },
  onUpdateFrom: { type: Function, default: null },
  onUpdateTo: { type: Function, default: null },
})
</script>
