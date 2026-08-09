<template>
  <section class="dod-page__list-block">
    <h2>Шаблоны задач</h2>

    <p v-if="isLoading" role="status">Загрузка…</p>

    <p v-else-if="isError" class="dod-page__error" role="alert">
      {{ loadError || 'Не удалось загрузить шаблоны задач.' }}
      <button type="button" class="board-filters__chip" @click="onRetry?.()">Повторить</button>
    </p>

    <p v-else-if="templates.length === 0" class="dod-page__empty">
      Пока нет шаблонов задач.
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
          @click="onDelete?.(template.id)"
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
const props = defineProps({
  templates: { type: Array, required: true },
  tags: { type: Array, default: () => [] },
  priorityLabels: { type: Object, default: () => ({}) },
  isLoading: { type: Boolean, default: false },
  isError: { type: Boolean, default: false },
  loadError: { type: String, default: '' },
  canManage: { type: Boolean, default: false },
  pendingId: { type: String, default: null },
  isDeleting: { type: Boolean, default: false },
  deleteError: { type: String, default: '' },
  onDelete: { type: Function, default: null },
  onRetry: { type: Function, default: null },
})

function summaryFor(template) {
  const tagNames = props.tags
    .filter((tag) => (template.tagIds || []).includes(tag.id))
    .map((tag) => tag.name)

  const priorityLabel = template.priority
    ? props.priorityLabels[template.priority] || template.priority
    : null

  return (
    [
      priorityLabel ? 'Приоритет: ' + priorityLabel : null,
      template.subtaskTitles && template.subtaskTitles.length
        ? template.subtaskTitles.length + ' сабтасков'
        : null,
      template.checklistItems && template.checklistItems.length
        ? template.checklistItems.length + ' пунктов DoD'
        : null,
      tagNames.length ? 'Теги: ' + tagNames.join(', ') : null,
    ]
      .filter(Boolean)
      .join(' · ') || 'Только имя'
  )
}
</script>
