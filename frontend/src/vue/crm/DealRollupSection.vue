<template>
  <section
    v-if="isLoading || loadError || !isEmpty"
    class="task-rollup"
    aria-labelledby="deal-rollup-title"
  >
    <h3 id="deal-rollup-title">Сводка по задачам</h3>

    <p v-if="isLoading" class="task-rollup__empty" role="status">Считаем…</p>

    <p v-else-if="loadError" class="task-rollup__empty" role="alert">
      {{ loadError }}
      <button type="button" class="board-filters__chip" @click="onRetry?.()">Повторить</button>
    </p>

    <dl v-else class="task-rollup__grid">
      <div>
        <dt>Готово</dt>
        <dd>{{ doneLabel }}</dd>
      </div>
      <div>
        <dt>Ближайший срок</dt>
        <dd>{{ dueLabel }}</dd>
      </div>
    </dl>
  </section>
</template>

<script setup>
defineProps({
  isLoading: { type: Boolean, default: false },
  isEmpty: { type: Boolean, default: true },
  loadError: { type: String, default: '' },
  doneLabel: { type: String, default: '—' },
  dueLabel: { type: String, default: '—' },
  onRetry: { type: Function, default: null },
})
</script>
