<template>
  <div v-if="items.length === 0" class="apps-empty">
    <span>↗</span>
    <h2>Подключите первый рабочий ресурс</h2>
    <p>Вставьте ссылку выше — сервис определится автоматически.</p>
  </div>

  <aside v-else class="apps-list" aria-label="Подключённые приложения">
    <ul>
      <li
        v-for="app in items"
        :key="app.id"
        :class="['apps-list__item', { 'apps-list__item--active': selectedId === app.id }]"
      >
        <button type="button" :aria-pressed="selectedId === app.id" @click="onSelect?.(app.id)">
          <span
            :class="'apps-list__provider apps-list__provider--' + app.providerTone"
            aria-hidden="true"
          >
            {{ app.providerIcon }}
          </span>
          <span class="apps-list__copy">
            <strong>{{ app.title }}</strong>
            <small>
              {{ app.providerLabel }}
              <template v-if="app.createdByName"> · {{ app.createdByName }}</template>
            </small>
          </span>
        </button>

        <template v-if="app.canDelete">
          <div v-if="pendingDeleteId === app.id" class="apps-list__confirm">
            <button
              type="button"
              class="apps-list__confirm-yes"
              :disabled="isDeleting"
              @click="onConfirmDelete?.(app.id)"
            >
              Удалить
            </button>
            <button type="button" class="apps-list__confirm-no" @click="onCancelDelete?.()">
              Отмена
            </button>
          </div>
          <button
            v-else
            type="button"
            class="apps-list__delete"
            :disabled="isDeleting"
            :aria-label="'Удалить «' + app.title + '»'"
            @click="onRequestDelete?.(app.id)"
          >
            ×
          </button>
        </template>
      </li>
    </ul>

    <p v-if="deleteError" class="apps-list__error" role="alert">{{ deleteError }}</p>
  </aside>
</template>

<script setup>
defineProps({
  items: { type: Array, required: true },
  selectedId: { type: String, default: null },
  pendingDeleteId: { type: String, default: null },
  isDeleting: { type: Boolean, default: false },
  deleteError: { type: String, default: '' },
  onSelect: { type: Function, default: null },
  onRequestDelete: { type: Function, default: null },
  onConfirmDelete: { type: Function, default: null },
  onCancelDelete: { type: Function, default: null },
})
</script>
