<template>
  <section
    v-if="isLoading || loadError || !isEmpty"
    class="task-rollup"
    aria-labelledby="task-rollup-title"
  >
    <h3 id="task-rollup-title" class="task-drawer__section-title">
      Сводка
      <FieldHint :text="hint" />
    </h3>

    <p v-if="isLoading" class="task-rollup__empty" role="status">Считаем…</p>

    <div v-else-if="loadError" role="alert">
      <p class="text-sm text-red-400">{{ loadError }}</p>
      <button type="button" class="btn-ghost" @click="onRetry?.()">Повторить</button>
    </div>

    <dl v-else class="task-rollup__grid">
      <div>
        <dt>Готово</dt>
        <dd>{{ doneLabel }}</dd>
      </div>
      <div>
        <dt>Сумма сделок</dt>
        <dd>{{ amountLabel }}</dd>
      </div>
      <div>
        <dt>Ближайший срок</dt>
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
  loadError: { type: String, default: '' },
  hint: { type: String, default: '' },
  doneLabel: { type: String, default: '—' },
  amountLabel: { type: String, default: '—' },
  dueLabel: { type: String, default: '—' },
  onRetry: { type: Function, default: null },
})
</script>
