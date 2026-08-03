<template>
  <section class="dod-page__list-block">
    <h2>Шаблоны сделок</h2>

    <p v-if="isLoading" role="status">Загрузка…</p>

    <p v-else-if="templates.length === 0" class="dod-page__empty">
      Пока нет шаблонов сделок.
    </p>

    <ul v-else class="dod-page__list">
      <li v-for="template in templates" :key="template.id" class="dod-page__item">
        <div>
          <strong>{{ template.name }}</strong>
          <p>{{ summaryFor(template) }}</p>
        </div>
        <button
          v-if="canManage"
          type="button"
          class="btn-ghost"
          :disabled="pendingId === template.id || isDeleting"
          @click="emit('delete', template.id)"
        >
          Удалить
        </button>
      </li>
    </ul>

    <p v-if="deleteError" class="dod-page__error" role="alert">
      {{ deleteError }}
    </p>
  </section>
</template>

<script setup>
defineProps({
  templates: { type: Array, required: true },
  isLoading: { type: Boolean, default: false },
  canManage: { type: Boolean, default: false },
  pendingId: { type: String, default: null },
  isDeleting: { type: Boolean, default: false },
  deleteError: { type: String, default: '' },
})

const emit = defineEmits(['delete'])

function summaryFor(template) {
  return (
    [template.title, template.amount != null ? String(template.amount) : null, template.companyName]
      .filter(Boolean)
      .join(' · ') || 'Только имя'
  )
}
</script>
