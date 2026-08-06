<template>
  <header class="epic-board__toolbar">
    <div>
      <p class="epic-board__eyebrow">Эпик-борд</p>
      <h1 class="epic-board__title">Стикеры по статусам</h1>
    </div>
    <label class="epic-board__epic-picker">
      <span>Эпик</span>
      <select
        class="glass-input"
        :value="epicId"
        :disabled="pickerDisabled"
        @change="onEpicChange?.($event.target.value || null)"
      >
        <option v-if="epics.length === 0" value="">Нет эпиков</option>
        <option v-for="epic in epics" :key="epic.id" :value="epic.id">
          {{ epic.title }}
        </option>
      </select>
    </label>
  </header>
</template>

<script setup>
defineProps({
  epicId: { type: String, default: '' },
  epics: { type: Array, default: () => [] },
  pickerDisabled: { type: Boolean, default: false },
  onEpicChange: { type: Function, default: null },
})
</script>
