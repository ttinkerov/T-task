<template>
  <section class="dod-page__list-block">
    <h2>Шаблоны</h2>

    <p v-if="isLoading">Загрузка...</p>

    <p v-else-if="templates.length === 0" class="dod-page__empty">
      Пока нет шаблонов DoD.
    </p>

    <ul class="dod-page__list">
      <li v-for="template in templates" :key="template.id">
        <div>
          <strong>{{ template.name }}</strong>
          <p>
            {{ (template.items && template.items.length) || 0 }} пунктов
            {{ template.gatesCompletion ? ' · блокирует Done' : ' · без блокировки' }}
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
              @change="onToggle(template.id, $event)"
            />
            Gate
          </label>
          <button
            type="button"
            class="btn-ghost"
            :disabled="pendingId === template.id"
            @click="emit('delete', template.id)"
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
defineProps({
  templates: { type: Array, required: true },
  isLoading: { type: Boolean, default: false },
  canManage: { type: Boolean, default: false },
  pendingId: { type: String, default: null },
  deleteError: { type: String, default: '' },
  updateError: { type: String, default: '' },
})

const emit = defineEmits(['toggle-gate', 'delete'])

function onToggle(templateId, event) {
  emit('toggle-gate', { templateId, gatesCompletion: event.target.checked })
}
</script>
