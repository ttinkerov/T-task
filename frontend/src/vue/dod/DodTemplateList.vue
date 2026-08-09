<template>
  <section class="dod-page__list-block">
    <h2>Шаблоны</h2>

    <p v-if="isLoading">Загрузка...</p>

    <p v-else-if="isError" class="dod-page__error" role="alert">
      {{ loadError || 'Не удалось загрузить шаблоны.' }}
      <button type="button" class="board-filters__chip" @click="onRetry?.()">Повторить</button>
    </p>

    <p v-else-if="templates.length === 0" class="dod-page__empty">
      Пока нет шаблонов критериев готовности.
    </p>

    <ul class="dod-page__list">
      <li v-for="template in templates" :key="template.id">
        <div>
          <strong>{{ template.name }}</strong>
          <p>
            {{ (template.items && template.items.length) || 0 }} пунктов
            {{ template.gatesCompletion ? ' · блокирует «Готово»' : ' · без блокировки' }}
          </p>
          <ol v-if="template.items && template.items.length > 0">
            <li v-for="item in template.items" :key="item.id">{{ item.text }}</li>
          </ol>
        </div>

        <div v-if="canManage" class="dod-page__actions">
          <label>
            <input
              type="checkbox"
              :checked="template.gatesCompletion"
              :disabled="pendingId === template.id"
              @change="handleToggle(template.id, $event)"
            />
            Блокировать «Готово»
          </label>
          <button
            type="button"
            class="btn-ghost"
            :disabled="pendingId === template.id"
            @click="onDelete?.(template.id)"
          >
            Удалить
          </button>
        </div>
      </li>
    </ul>

    <p v-if="deleteError" class="dod-page__error">{{ deleteError }}</p>
    <p v-if="updateError" class="dod-page__error">{{ updateError }}</p>
  </section>
</template>

<script setup>
const props = defineProps({
  templates: { type: Array, required: true },
  isLoading: { type: Boolean, default: false },
  isError: { type: Boolean, default: false },
  loadError: { type: String, default: '' },
  canManage: { type: Boolean, default: false },
  pendingId: { type: String, default: null },
  deleteError: { type: String, default: '' },
  updateError: { type: String, default: '' },
  onToggleGate: { type: Function, default: null },
  onDelete: { type: Function, default: null },
  onRetry: { type: Function, default: null },
})

function handleToggle(templateId, event) {
  props.onToggleGate?.({ templateId, gatesCompletion: event.target.checked })
}
</script>
