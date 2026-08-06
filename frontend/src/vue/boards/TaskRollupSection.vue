<template>
  <section
    v-if="isLoading || !isEmpty"
    class="task-rollup"
    aria-labelledby="task-rollup-title"
  >
    <h3 id="task-rollup-title" class="task-drawer__section-title">
      Сводка
      <FieldHint :text="hint" />
    </h3>

    <p v-if="isLoading" class="task-rollup__empty" role="status">Считаем…</p>

    <dl v-else class="task-rollup__grid">
      <div>
        <dt>% done</dt>
        <dd>{{ doneLabel }}</dd>
      </div>
      <div>
        <dt>Сумма сделок</dt>
        <dd>{{ amountLabel }}</dd>
      </div>
      <div>
        <dt>Ближайший due</dt>
        <dd>{{ dueLabel }}</dd>
      </div>
    </dl>
  </section>
</template>

<script setup>
import FieldHint from './FieldHint.vue'

defineProps({
  isLoading: { type: Boolean, default: false },
  isEmpty: { type: Boolean, default: true },
  hint: { type: String, default: '' },
  doneLabel: { type: String, default: '—' },
  amountLabel: { type: String, default: '—' },
  dueLabel: { type: String, default: '—' },
})
</script>
