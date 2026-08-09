<template>
  <div class="tt-demo-column-wrap" :data-column-id="column.id">
    <div class="tt-demo-column">
      <div class="tt-demo-column__header">
        <button type="button" class="tt-demo-column__drag" aria-label="Перетащить колонку">
          ⠿
        </button>

        <input
          v-if="editingName"
          v-model="columnName"
          class="tt-demo-column__title-input"
          maxlength="40"
          autofocus
          @blur="commitRename"
          @keydown.enter.prevent="commitRename"
          @keydown.escape.prevent="cancelRename"
        />
        <button
          v-else
          type="button"
          class="tt-demo-column__title"
          title="Переименовать"
          @click="startRename"
        >
          {{ column.name }}
        </button>

        <span class="tt-demo-column__count">{{ column.tasks.length }}</span>

        <button
          v-if="canDelete"
          type="button"
          class="tt-demo-column__delete"
          aria-label="Удалить колонку"
          title="Удалить пустую колонку"
          @click="onDeleteColumn?.(column.id)"
        >
          ×
        </button>
      </div>

      <div ref="tasksEl" class="tt-demo-column__tasks" :data-column-id="column.id">
        <KanbanDemoTask
          v-for="task in column.tasks"
          :key="task.id"
          :task="task"
          :on-rename="onRenameTask"
          :on-delete="onDeleteTask"
        />
      </div>

      <form class="tt-demo-column__add" @submit.prevent="submitTask">
        <input
          v-model="taskTitle"
          placeholder="Новая задача..."
          maxlength="120"
          class="tt-demo-column__add-input"
        />
        <button
          type="submit"
          class="tt-demo-column__add-btn"
          aria-label="Добавить задачу"
          :disabled="!taskTitle.trim()"
        >
          +
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import KanbanDemoTask from './KanbanDemoTask.vue';

const props = defineProps({
  column: { type: Object, required: true },
  canDelete: { type: Boolean, default: false },
  onAddTask: { type: Function, default: null },
  onRenameColumn: { type: Function, default: null },
  onRenameTask: { type: Function, default: null },
  onDeleteTask: { type: Function, default: null },
  onDeleteColumn: { type: Function, default: null },
  onTasksEl: { type: Function, default: null },
});

const tasksEl = ref(null);
const taskTitle = ref('');
const editingName = ref(false);
const columnName = ref(props.column.name);

watch(
  () => props.column.name,
  (value) => {
    if (!editingName.value) columnName.value = value;
  },
);

function startRename() {
  columnName.value = props.column.name;
  editingName.value = true;
}

function commitRename() {
  props.onRenameColumn?.(props.column.id, columnName.value);
  editingName.value = false;
}

function cancelRename() {
  columnName.value = props.column.name;
  editingName.value = false;
}

function submitTask() {
  props.onAddTask?.(props.column.id, taskTitle.value);
  taskTitle.value = '';
}

onMounted(() => props.onTasksEl?.(props.column.id, tasksEl.value));
watch(tasksEl, (el) => props.onTasksEl?.(props.column.id, el));
onBeforeUnmount(() => props.onTasksEl?.(props.column.id, null));
</script>
