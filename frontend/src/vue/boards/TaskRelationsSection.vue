<template>
  <section class="task-relations" aria-labelledby="task-relations-title">
    <div class="task-relations__heading">
      <div>
        <h3 id="task-relations-title" class="task-drawer__section-title">
          Связи
          <FieldHint text="Зависимости между задачами: блокирует, ожидает или просто связана." />
        </h3>
        <p>Покажите порядок выполнения и зависимость между задачами.</p>
      </div>
      <span>{{ relations.length }}</span>
    </div>

    <p v-if="isLoading" class="task-relations__empty" role="status">Загружаем связи…</p>
    <p v-else-if="loadError" class="task-relations__error" role="alert">
      Не удалось загрузить связи.
      <button type="button" class="board-filters__chip" @click="onRetry?.()">Повторить</button>
    </p>
    <p v-else-if="relations.length === 0" class="task-relations__empty">
      У задачи пока нет связей
    </p>
    <ul v-else class="task-relations__list">
      <li v-for="relation in relations" :key="relation.id">
        <span
          class="task-relations__icon"
          :class="'task-relations__icon--' + relation.type.toLowerCase()"
          aria-hidden="true"
        >
          {{ icons[relation.type] || '↔' }}
        </span>
        <button type="button" class="task-relations__task" @click="onOpenTask?.(relation.task.id)">
          <span>{{ labels[relation.type] || relation.type }}</span>
          <strong>{{ relation.task.title }}</strong>
          <small>
            {{ relation.task.columnName
            }}{{ relation.task.completed ? ' · выполнена' : '' }}
          </small>
        </button>
        <button
          type="button"
          class="task-relations__delete"
          :disabled="deletingId === relation.id"
          :aria-label="'Удалить связь с задачей «' + relation.task.title + '»'"
          @click="onDelete?.(relation.id, relation.task.id)"
        >
          {{ deletingId === relation.id ? '…' : '×' }}
        </button>
      </li>
    </ul>

    <form class="task-relations__form" @submit.prevent="submit">
      <label>
        <span>Тип связи</span>
        <select v-model="type" class="glass-input">
          <option v-for="option in relationOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </label>
      <label>
        <span>Задача</span>
        <select v-model="relatedTaskId" class="glass-input">
          <option value="">Выберите задачу</option>
          <option v-for="candidate in availableCandidates" :key="candidate.id" :value="candidate.id">
            {{ candidate.title }} · {{ candidate.columnName }}
          </option>
        </select>
      </label>
      <p>{{ typeHint }}</p>
      <button type="submit" class="btn-ghost" :disabled="!relatedTaskId || createPending">
        {{ createPending ? 'Добавляем…' : 'Добавить связь' }}
      </button>
    </form>

    <p v-if="actionError" class="task-relations__error" role="alert">{{ actionError }}</p>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import FieldHint from './FieldHint.vue'

const props = defineProps({
  relations: { type: Array, default: () => [] },
  availableCandidates: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false },
  loadError: { type: Boolean, default: false },
  createPending: { type: Boolean, default: false },
  deletingId: { type: String, default: null },
  actionError: { type: String, default: '' },
  onOpenTask: { type: Function, default: null },
  onDelete: { type: Function, default: null },
  onCreate: { type: Function, default: null },
  onRetry: { type: Function, default: null },
})

const relationOptions = [
  { value: 'BLOCKS', label: 'Блокирует', hint: 'Эту задачу нужно завершить первой' },
  {
    value: 'WAITING_FOR',
    label: 'Ожидает',
    hint: 'Эту задачу нельзя завершить раньше выбранной',
  },
  { value: 'RELATES_TO', label: 'Связана', hint: 'Задачи связаны, но не блокируют друг друга' },
]

const labels = {
  BLOCKS: 'Блокирует',
  WAITING_FOR: 'Ожидает',
  RELATES_TO: 'Связана',
}

const icons = {
  BLOCKS: '→',
  WAITING_FOR: '←',
  RELATES_TO: '↔',
}

const type = ref('WAITING_FOR')
const relatedTaskId = ref('')

const typeHint = computed(
  () => relationOptions.find((option) => option.value === type.value)?.hint || '',
)

async function submit() {
  if (!relatedTaskId.value) return
  try {
    await props.onCreate?.(type.value, relatedTaskId.value)
    relatedTaskId.value = ''
  } catch {
    /* ignore */
  }
}
</script>
