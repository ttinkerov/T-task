<template>
  <section
    v-if="isLoading || loadError || backlinks.length > 0"
    class="task-relations"
    aria-labelledby="task-backlinks-title"
  >
    <div class="task-relations__heading">
      <div>
        <h3 id="task-backlinks-title" class="task-drawer__section-title">
          Упоминания
          <FieldHint text="Задачи, в описании которых есть [[ссылка]] на эту карточку." />
        </h3>
        <p>Обратные ссылки из описаний других задач.</p>
      </div>
      <span>{{ backlinks.length }}</span>
    </div>

    <p v-if="isLoading" class="task-relations__empty" role="status">Загружаем упоминания…</p>
    <p v-else-if="loadError" class="task-relations__error" role="alert">
      Не удалось загрузить упоминания.
    </p>
    <ul v-else class="task-relations__list">
      <li v-for="link in backlinks" :key="link.id">
        <span
          class="task-relations__icon task-relations__icon--relates_to"
          aria-hidden="true"
        >
          ←
        </span>
        <button type="button" class="task-relations__task" @click="onOpenTask?.(link.id)">
          <span>Упоминает</span>
          <strong>{{ link.title }}</strong>
          <small>{{ link.columnName }}</small>
        </button>
      </li>
    </ul>
  </section>
</template>

<script setup>
import FieldHint from './FieldHint.vue'

defineProps({
  backlinks: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false },
  loadError: { type: Boolean, default: false },
  onOpenTask: { type: Function, default: null },
})
</script>
