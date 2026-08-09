<template>
  <div>
    <p class="sr-only" role="status" aria-live="polite" aria-atomic="true">
      {{ statusMessage }}
    </p>

    <p
      v-if="isLoading"
      class="activity-page__state"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      Загрузка журнала…
    </p>

    <p v-else-if="isError" class="activity-page__error" role="alert">
      Не удалось загрузить журнал.
      <button type="button" class="board-filters__chip" @click="onRetry?.()">Повторить</button>
    </p>

    <template v-else-if="items.length > 0">
      <ol class="activity-list" tabindex="-1" aria-label="Записи журнала действий">
        <li v-for="entry in items" :key="entry.id" class="activity-list__item">
          <span class="activity-list__avatar" aria-hidden="true">
            {{ actorInitial(entry.actorName) }}
          </span>
          <div class="activity-list__content">
            <p>
              <strong>{{ actorName(entry.actorName) }}</strong>
              {{ actionLabels[entry.action] || 'выполнил(а) действие' }}
              <span v-if="entry.entityName" class="activity-list__entity">
                «{{ entry.entityName }}»
              </span>
            </p>
            <time :datetime="toIso(entry.createdAt)">
              {{ formatCreatedAt(entry.createdAt) }}
            </time>
          </div>
        </li>
      </ol>

      <nav
        class="activity-pagination"
        aria-label="Страницы журнала действий"
        :aria-busy="isFetching"
      >
        <button
          type="button"
          class="btn-ghost"
          :disabled="page <= 1 || isFetching"
          @click="goToPage(page - 1)"
        >
          ← Назад
        </button>
        <span aria-hidden="true">Страница {{ page }} из {{ totalPages }}</span>
        <button
          type="button"
          class="btn-ghost"
          :disabled="page >= totalPages || isFetching"
          @click="goToPage(page + 1)"
        >
          Далее →
        </button>
      </nav>
    </template>

    <div v-else class="activity-page__empty">
      <span aria-hidden="true" role="presentation">↻</span>
      <h2>Событий пока нет</h2>
      <p>Новые административные действия появятся здесь автоматически.</p>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  items: { type: Array, required: true },
  page: { type: Number, required: true },
  totalPages: { type: Number, required: true },
  isLoading: { type: Boolean, default: false },
  isFetching: { type: Boolean, default: false },
  isError: { type: Boolean, default: false },
  statusMessage: { type: String, default: '' },
  actionLabels: { type: Object, required: true },
  onRetry: { type: Function, default: null },
  onPageChange: { type: Function, default: null },
})

function goToPage(nextPage) {
  props.onPageChange?.(nextPage)
}

function actorName(name) {
  const trimmed = (name || '').trim()
  return trimmed || 'Удалённый пользователь'
}

function actorInitial(name) {
  return actorName(name).slice(0, 1).toUpperCase()
}

function toIso(value) {
  return new Date(value).toISOString()
}

function formatCreatedAt(value) {
  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}
</script>
