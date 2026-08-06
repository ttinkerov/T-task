<template>
  <div>
    <p v-if="isLoading" role="status">Загрузка задач...</p>
    <p v-if="isError" class="all-tasks__error">Не удалось загрузить задачи.</p>

    <div
      v-if="showContent"
      :class="contentClass"
      :aria-busy="isFetching"
    >
      <span v-if="isFetching" class="sr-only">Обновление списка задач</span>

      <p v-if="rows.length === 0" class="task-display-empty">
        В этом режиме пока нет подходящих задач.
      </p>

      <div v-else class="task-list-view">
        <table>
          <caption class="sr-only">
            Таблица задач с исполнителями, статусами и дедлайнами
          </caption>
          <thead>
            <tr>
              <th scope="col">Задача</th>
              <th scope="col">Статус</th>
              <th scope="col">Исполнитель</th>
              <th scope="col">Приоритет</th>
              <th scope="col">Дедлайн</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.id">
              <td>
                <button type="button" @click="onOpenTask(row.id)">
                  {{ row.title }}
                </button>
              </td>
              <td>
                <span class="task-list-view__status">{{ row.columnName }}</span>
              </td>
              <td>{{ row.assigneeName }}</td>
              <td>{{ row.priorityLabel }}</td>
              <td>{{ formatDue(row.dueDate) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <nav
      v-if="showContent && totalPages > 1"
      class="all-tasks__pagination"
      aria-label="Страницы задач"
    >
      <button type="button" :disabled="page <= 1" @click="onPageChange(page - 1)">
        Назад
      </button>
      <span>Страница {{ page }} из {{ totalPages }}</span>
      <button
        type="button"
        :disabled="page >= totalPages"
        @click="onPageChange(page + 1)"
      >
        Вперёд
      </button>
    </nav>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  rows: { type: Array, required: true },
  isLoading: { type: Boolean, default: false },
  isError: { type: Boolean, default: false },
  isFetching: { type: Boolean, default: false },
  page: { type: Number, default: 1 },
  totalPages: { type: Number, default: 1 },
  onOpenTask: { type: Function, required: true },
  onPageChange: { type: Function, required: true },
})

const showContent = computed(() => !props.isLoading && !props.isError)

const contentClass = computed(() =>
  props.isFetching
    ? 'all-tasks__content all-tasks__content--loading'
    : 'all-tasks__content',
)

function formatDue(value) {
  if (!value) return 'Без срока'
  return new Date(value).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
</script>
