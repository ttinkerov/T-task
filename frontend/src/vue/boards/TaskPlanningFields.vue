<template>
  <div class="task-drawer__grid">
    <label class="task-drawer__field">
      <span class="task-drawer__label">
        Спринт
        <FieldHint text="Короткий рабочий цикл (обычно 1–2 недели), в который входит задача." />
      </span>
      <select class="glass-input" :value="sprintId" @change="onSprintChange?.($event.target.value)">
        <option value="">Без спринта</option>
        <option v-for="sprint in sprints" :key="sprint.id" :value="sprint.id">
          {{ sprint.name }}
        </option>
      </select>
      <p v-if="sprintsLoadError" class="text-sm text-red-400" role="alert">
        {{ sprintsLoadError }}
        <button type="button" class="board-filters__chip" @click="onRetrySprints?.()">
          Повторить
        </button>
      </p>
    </label>

    <label class="task-drawer__field">
      <span class="task-drawer__label">
        Эпик
        <FieldHint text="Крупная цель. Задачу можно вложить в эпик или отметить саму как эпик." />
      </span>
      <select
        class="glass-input"
        :value="isEpic ? '' : epicId"
        :disabled="isEpic"
        @change="onEpicChange?.($event.target.value)"
      >
        <option value="">Без эпика</option>
        <option v-for="epic in epicOptions" :key="epic.id" :value="epic.id">
          {{ epic.title }}
        </option>
      </select>
      <label class="forms-editor__checkbox" style="margin-top: 0.5rem">
        <input type="checkbox" :checked="isEpic" @change="onIsEpicToggle" />
        Это эпик
      </label>
    </label>
  </div>
</template>

<script setup>
import FieldHint from './FieldHint.vue';

const props = defineProps({
  sprintId: { type: String, default: '' },
  epicId: { type: String, default: '' },
  isEpic: { type: Boolean, default: false },
  sprints: { type: Array, default: () => [] },
  epicOptions: { type: Array, default: () => [] },
  sprintsLoadError: { type: String, default: '' },
  onSprintChange: { type: Function, default: null },
  onEpicChange: { type: Function, default: null },
  onIsEpicChange: { type: Function, default: null },
  onRetrySprints: { type: Function, default: null },
});

function onIsEpicToggle(event) {
  const checked = event.target.checked;
  props.onIsEpicChange?.(checked);
  if (checked) props.onEpicChange?.('');
}
</script>
