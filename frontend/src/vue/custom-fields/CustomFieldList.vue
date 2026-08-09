<template>
  <section class="custom-fields-page__list-block" aria-labelledby="custom-fields-list-title">
    <h2 id="custom-fields-list-title">Поля команды</h2>

    <p v-if="isLoading" class="text-sm text-muted-foreground" role="status">
      Загрузка полей…
    </p>

    <p v-else-if="isError" class="custom-fields-page__error" role="alert">
      {{ loadError || 'Не удалось загрузить поля.' }}
      <button type="button" class="board-filters__chip" @click="onRetry?.()">Повторить</button>
    </p>

    <p v-else-if="fields.length === 0" class="text-sm text-muted-foreground">
      Пока нет ни одного поля.
    </p>

    <ul v-else class="custom-fields-page__list" role="list">
      <li v-for="field in fields" :key="field.id" class="custom-fields-page__item">
        <div class="custom-fields-page__item-main">
          <span class="custom-fields-page__item-name">{{ field.name }}</span>
          <span class="custom-fields-page__badge">
            {{ typeLabels[field.type] || field.type }}
          </span>
          <span v-if="field.options && field.options.length > 0" class="custom-fields-page__options">
            {{ field.options.join(', ') }}
          </span>
        </div>

        <div v-if="canManage" class="custom-fields-page__item-actions">
          <label class="custom-fields-page__toggle">
            <input
              type="checkbox"
              :checked="field.showOnCard"
              :disabled="pendingId === field.id"
              @change="handleToggle(field.id, $event)"
            />
            <span>На карточке</span>
          </label>
          <button
            type="button"
            class="custom-fields-page__delete"
            :disabled="pendingId === field.id"
            :aria-label="'Удалить поле «' + field.name + '»'"
            @click="onDelete?.(field.id)"
          >
            {{ pendingId === field.id ? '…' : 'Удалить' }}
          </button>
        </div>
      </li>
    </ul>

    <p v-if="actionError" class="custom-fields-page__error" role="alert">{{ actionError }}</p>
  </section>
</template>

<script setup>
const props = defineProps({
  fields: { type: Array, required: true },
  isLoading: { type: Boolean, default: false },
  isError: { type: Boolean, default: false },
  loadError: { type: String, default: '' },
  actionError: { type: String, default: '' },
  canManage: { type: Boolean, default: false },
  pendingId: { type: String, default: null },
  typeLabels: { type: Object, required: true },
  onToggleCard: { type: Function, default: null },
  onDelete: { type: Function, default: null },
  onRetry: { type: Function, default: null },
})

function handleToggle(fieldId, event) {
  props.onToggleCard?.({ fieldId, showOnCard: event.target.checked })
}
</script>
