<template>
  <div class="tt-board">
    <div class="tt-board__card tt-board__card--interactive">
      <div class="tt-board__header">
        <div>
          <p class="tt-board__name">Демо режим</p>
        </div>
      </div>

      <div ref="boardEl" class="tt-demo-board">
        <KanbanDemoColumn
          v-for="column in columns"
          :key="column.id"
          :column="column"
          :can-delete="columns.length > 1 && column.tasks.length === 0"
          :on-add-task="addTask"
          :on-rename-column="renameColumn"
          :on-rename-task="renameTask"
          :on-delete-task="deleteTask"
          :on-delete-column="deleteColumn"
          :on-tasks-el="registerTasksEl"
        />

        <form class="tt-demo-board__add-column" @submit.prevent="addColumn">
          <input
            v-model="newColumnName"
            placeholder="Новая колонка"
            maxlength="40"
            class="tt-demo-board__input"
          />
          <button type="submit" class="tt-demo-board__add-btn" :disabled="!newColumnName.trim()">
            +
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import Sortable from 'sortablejs';
import KanbanDemoColumn from './KanbanDemoColumn.vue';

const INITIAL = [
  {
    id: 'demo-col-1',
    name: 'Бэклог',
    tasks: [
      { id: 'demo-task-1', title: 'Исследование', columnId: 'demo-col-1' },
      { id: 'demo-task-2', title: 'Прототип', columnId: 'demo-col-1' },
    ],
  },
  {
    id: 'demo-col-2',
    name: 'В работе',
    tasks: [{ id: 'demo-task-3', title: 'Дизайн UI', columnId: 'demo-col-2' }],
  },
  {
    id: 'demo-col-3',
    name: 'Готово',
    tasks: [{ id: 'demo-task-4', title: 'Авторизация', columnId: 'demo-col-3' }],
  },
];

const columns = ref(INITIAL.map((column) => ({ ...column, tasks: [...column.tasks] })));
const newColumnName = ref('');
const boardEl = ref(null);
const tasksEls = reactive({});
let nextId = 100;
let columnSortable = null;
const taskSortables = {};

function createId(prefix) {
  nextId += 1;
  return prefix + '-' + nextId;
}

function registerTasksEl(columnId, el) {
  if (!el) {
    if (taskSortables[columnId]) {
      taskSortables[columnId].destroy();
      delete taskSortables[columnId];
    }
    delete tasksEls[columnId];
    return;
  }
  tasksEls[columnId] = el;
  nextTick(() => setupTaskSortable(columnId, el));
}

function revertDomMove(evt) {
  const { item, from, to, oldIndex } = evt;
  if (from === to) {
    const reference = from.children[oldIndex] || null;
    if (item !== reference) from.insertBefore(item, reference);
    return;
  }
  if (item.parentNode === to) to.removeChild(item);
  const reference = from.children[oldIndex] || null;
  from.insertBefore(item, reference);
}

function setupColumnSortable() {
  if (!boardEl.value || columnSortable) return;
  columnSortable = Sortable.create(boardEl.value, {
    animation: 160,
    draggable: '.tt-demo-column-wrap',
    handle: '.tt-demo-column__drag',
    direction: 'horizontal',
    ghostClass: 'tt-demo-column--ghost',
    filter:
      '.tt-demo-board__add-column, input, textarea, select, button:not(.tt-demo-column__drag)',
    preventOnFilter: true,
    onEnd(evt) {
      const { oldIndex, newIndex } = evt;
      if (oldIndex == null || newIndex == null || oldIndex === newIndex) return;
      revertDomMove(evt);
      const next = [...columns.value];
      const [moved] = next.splice(oldIndex, 1);
      next.splice(newIndex, 0, moved);
      columns.value = next;
    },
  });
}

function setupTaskSortable(columnId, el) {
  if (taskSortables[columnId]) {
    taskSortables[columnId].destroy();
  }
  taskSortables[columnId] = Sortable.create(el, {
    group: 'demo-tasks',
    animation: 160,
    handle: '.tt-demo-task__drag',
    draggable: '.tt-demo-task',
    ghostClass: 'tt-demo-task--ghost',
    filter: 'input, textarea, button:not(.tt-demo-task__drag)',
    preventOnFilter: true,
    onEnd(evt) {
      const { oldIndex, newIndex, from, to, item } = evt;
      if (oldIndex == null || newIndex == null) return;
      const fromId = from.dataset.columnId;
      const toId = to.dataset.columnId;
      if (!fromId || !toId) return;
      if (fromId === toId && oldIndex === newIndex) return;

      revertDomMove(evt);

      const source = columns.value.find((column) => column.id === fromId);
      const target = columns.value.find((column) => column.id === toId);
      if (!source || !target) return;
      const task = source.tasks[oldIndex];
      if (!task || task.id !== item.dataset.taskId) return;

      columns.value = columns.value.map((column) => {
        if (column.id === fromId && column.id === toId) {
          const tasks = [...column.tasks];
          const [moved] = tasks.splice(oldIndex, 1);
          tasks.splice(newIndex, 0, moved);
          return { ...column, tasks };
        }
        if (column.id === fromId) {
          return { ...column, tasks: column.tasks.filter((_, index) => index !== oldIndex) };
        }
        if (column.id === toId) {
          const tasks = [...column.tasks];
          tasks.splice(newIndex, 0, { ...task, columnId: toId });
          return { ...column, tasks };
        }
        return column;
      });
    },
  });
}

function addTask(columnId, title) {
  const trimmed = title.trim();
  if (!trimmed) return;
  columns.value = columns.value.map((column) =>
    column.id === columnId
      ? {
          ...column,
          tasks: [...column.tasks, { id: createId('demo-task'), title: trimmed, columnId }],
        }
      : column,
  );
}

function renameColumn(columnId, name) {
  const trimmed = name.trim();
  if (!trimmed) return;
  columns.value = columns.value.map((column) =>
    column.id === columnId ? { ...column, name: trimmed } : column,
  );
}

function renameTask(taskId, title) {
  const trimmed = title.trim();
  if (!trimmed) return;
  columns.value = columns.value.map((column) => ({
    ...column,
    tasks: column.tasks.map((task) => (task.id === taskId ? { ...task, title: trimmed } : task)),
  }));
}

function deleteTask(taskId) {
  columns.value = columns.value.map((column) => ({
    ...column,
    tasks: column.tasks.filter((task) => task.id !== taskId),
  }));
}

function deleteColumn(columnId) {
  if (columns.value.length <= 1) return;
  const column = columns.value.find((item) => item.id === columnId);
  if (!column || column.tasks.length > 0) return;
  columns.value = columns.value.filter((item) => item.id !== columnId);
}

function addColumn() {
  const trimmed = newColumnName.value.trim();
  if (!trimmed) return;
  const id = createId('demo-col');
  columns.value = [...columns.value, { id, name: trimmed, tasks: [] }];
  newColumnName.value = '';
}

onMounted(() => {
  nextTick(setupColumnSortable);
});

onBeforeUnmount(() => {
  columnSortable?.destroy();
  columnSortable = null;
  Object.keys(taskSortables).forEach((id) => {
    taskSortables[id].destroy();
    delete taskSortables[id];
  });
});
</script>
