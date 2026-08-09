<template>
  <div class="tt-demo-task" :data-task-id="task.id">
    <button type="button" class="tt-demo-task__drag" aria-label="Перетащить задачу">⠿</button>

    <input
      v-if="editing"
      v-model="title"
      class="tt-demo-task__input"
      maxlength="120"
      autofocus
      @blur="commit"
      @keydown.enter.prevent="commit"
      @keydown.escape.prevent="cancel"
    />
    <button
      v-else
      type="button"
      class="tt-demo-task__title"
      title="Двойной клик - переименовать"
      @dblclick="startEdit"
    >
      {{ task.title }}
    </button>

    <button
      type="button"
      class="tt-demo-task__delete"
      aria-label="Удалить задачу"
      @click="onDelete?.(task.id)"
    >
      ×
    </button>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  task: { type: Object, required: true },
  onRename: { type: Function, default: null },
  onDelete: { type: Function, default: null },
});

const editing = ref(false);
const title = ref(props.task.title);

watch(
  () => props.task.title,
  (value) => {
    if (!editing.value) title.value = value;
  },
);

function startEdit() {
  title.value = props.task.title;
  editing.value = true;
}

function commit() {
  props.onRename?.(props.task.id, title.value);
  editing.value = false;
}

function cancel() {
  title.value = props.task.title;
  editing.value = false;
}
</script>
