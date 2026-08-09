<template>
  <div>
    <p class="sr-only" role="status" aria-live="polite" aria-atomic="true">
      {{ isLoading ? 'Загрузка корзины…' : statusText }}
    </p>

    <p v-if="isLoading" class="trash-page__state" role="status">Загрузка корзины…</p>

    <p v-else-if="isError" class="trash-page__error" role="alert">
      Не удалось загрузить корзину. Попробуйте обновить страницу.
    </p>

    <template v-else>
      <p v-if="actionError" class="trash-page__error" role="alert">{{ actionError }}</p>

      <template v-if="items.length > 0">
        <ul class="trash-list" tabindex="-1" aria-label="Элементы в корзине">
          <li v-for="item in items" :key="itemKey(item)" class="trash-list__item">
            <div class="trash-list__content">
              <span class="trash-list__type">{{
                typeLabels[item.entityType] || item.entityType
              }}</span>
              <p class="trash-list__name">{{ item.entityName }}</p>
              <time :datetime="item.deletedAt">Удалено {{ formatDeletedAt(item.deletedAt) }}</time>
            </div>
            <TrashItemActions
              :can-purge="canPurge"
              :busy="busyKey === itemKey(item)"
              :entity-name="item.entityName"
              @restore="
                onRestore?.({ entityType: item.entityType, entityId: item.entityId })
              "
              @purge="onPurge?.({ entityType: item.entityType, entityId: item.entityId })"
            />
          </li>
        </ul>

        <nav v-if="totalPages > 1" class="trash-page__pagination" aria-label="Страницы корзины">
          <button
            type="button"
            :disabled="page <= 1 || isFetching"
            @click="onPageChange?.(page - 1)"
          >
            Назад
          </button>
          <span>{{ page }} / {{ totalPages }}</span>
          <button
            type="button"
            :disabled="page >= totalPages || isFetching"
            @click="onPageChange?.(page + 1)"
          >
            Вперёд
          </button>
        </nav>
      </template>

      <div v-else class="trash-page__empty">
        <span aria-hidden="true">🗑</span>
        <h2>Корзина пуста</h2>
        <p>Удалённые задачи, сделки и приложения появятся здесь.</p>
      </div>
    </template>
  </div>
</template>

<script setup>
import TrashItemActions from './TrashItemActions.vue'

defineProps({
  items: { type: Array, required: true },
  page: { type: Number, required: true },
  totalPages: { type: Number, required: true },
  isLoading: { type: Boolean, default: false },
  isFetching: { type: Boolean, default: false },
  isError: { type: Boolean, default: false },
  actionError: { type: String, default: '' },
  canPurge: { type: Boolean, default: false },
  busyKey: { type: String, default: null },
  typeLabels: { type: Object, required: true },
  statusText: { type: String, default: '' },
  onRestore: { type: Function, default: null },
  onPurge: { type: Function, default: null },
  onPageChange: { type: Function, default: null },
})

function itemKey(item) {
  return item.entityType + ':' + item.entityId
}

function formatDeletedAt(value) {
  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}
</script>
