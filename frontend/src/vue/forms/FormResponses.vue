<template>
  <div v-if="responsesError" role="alert">
    <p class="forms-page__empty text-red-400">{{ responsesError }}</p>
    <button type="button" class="btn-ghost" @click="onRetry?.()">Повторить</button>
  </div>

  <p v-else-if="!responsesData || responsesData.total === 0" class="forms-page__empty">
    Пока нет ответов на эту форму.
  </p>

  <div v-else class="forms-responses">
    <section v-if="responsesData.stats && responsesData.stats.length > 0" class="forms-panel">
      <h2 class="forms-panel__title">Статистика по вариантам</h2>
      <div class="forms-stats">
        <div
          v-for="stat in responsesData.stats"
          :key="stat.fieldId"
          class="forms-stats__block"
        >
          <h3>{{ stat.label }}</h3>
          <ul>
            <li v-for="item in stat.options" :key="item.option">
              <span>{{ item.option }}</span>
              <strong>{{ item.count }}</strong>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <section class="forms-panel">
      <h2 class="forms-panel__title">Все ответы</h2>
      <div class="board-workload__table-wrap">
        <table class="board-workload__table">
          <thead>
            <tr>
              <th>Дата</th>
              <th v-for="field in fields" :key="field.id">{{ field.label }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="response in responsesData.responses" :key="response.id">
              <td>{{ formatDate(response.createdAt) }}</td>
              <td v-for="field in fields" :key="field.id">
                {{ renderAnswer(response.answers[field.id]) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup>
defineProps({
  fields: { type: Array, required: true },
  responsesData: { type: Object, default: null },
  responsesError: { type: String, default: '' },
  onRetry: { type: Function, default: null },
})

function formatDate(value) {
  return new Date(value).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function renderAnswer(value) {
  if (Array.isArray(value)) return value.join(', ')
  if (value) return String(value)
  return '—'
}
</script>
