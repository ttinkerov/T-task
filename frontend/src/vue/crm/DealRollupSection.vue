<template>
  <section
    v-if="isLoading || !isEmpty"
    class="task-rollup"
    aria-labelledby="deal-rollup-title"
  >
    <h3 id="deal-rollup-title">Сводка по задачам</h3>

    <p v-if="isLoading" class="task-rollup__empty" role="status">Считаем…</p>

    <dl v-else class="task-rollup__grid">
      <div>
        <dt>% done</dt>
        <dd>{{ doneLabel }}</dd>
      </div>
      <div>
        <dt>Ближайший due</dt>
        <dd>{{ dueLabel }}</dd>
      </div>
    </dl>
  </section>
</template>

<script setup>
defineProps({
  isLoading: { type: Boolean, default: false },
  isEmpty: { type: Boolean, default: true },
  doneLabel: { type: String, default: '—' },
  dueLabel: { type: String, default: '—' },
})
</script>
