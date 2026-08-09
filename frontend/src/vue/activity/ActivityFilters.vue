<template>
  <div class="analytics-filters" style="margin-bottom: 1rem">
    <label class="analytics-filters__group">
      <span class="analytics-filters__label">Действие</span>
      <select
        class="board-filters__select"
        :value="action"
        @change="emit('update-action', $event.target.value)"
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
        @change="emit('update-from', $event.target.value)"
      />
    </label>

    <label class="analytics-filters__group">
      <span class="analytics-filters__label">По</span>
      <input
        type="date"
        class="glass-input"
        :value="to"
        @change="emit('update-to', $event.target.value)"
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
})

const emit = defineEmits(['update-action', 'update-from', 'update-to'])
</script>
