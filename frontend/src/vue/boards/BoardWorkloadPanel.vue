<template>
  <div class="board-workload">
    <div class="board-workload__head">
      <div>
        <h3 class="board-workload__title">Загрузка по времени</h3>
        <p class="board-workload__hint">{{ hint }}</p>
      </div>
      <div class="board-workload__toggle" role="tablist" aria-label="Период загрузки">
        <button
          type="button"
          role="tab"
          :aria-selected="scope === 'today'"
          :class="
            scope === 'today'
              ? 'board-workload__toggle-btn board-workload__toggle-btn--active'
              : 'board-workload__toggle-btn'
          "
          @click="onScopeChange?.('today')"
        >
          На сегодня
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="scope === 'all'"
          :class="
            scope === 'all'
              ? 'board-workload__toggle-btn board-workload__toggle-btn--active'
              : 'board-workload__toggle-btn'
          "
          @click="onScopeChange?.('all')"
        >
          Весь проект
        </button>
      </div>
    </div>

    <div v-if="rows.length" class="board-workload__table-wrap">
      <table class="board-workload__table">
        <thead>
          <tr>
            <th>Сотрудник</th>
            <th>План</th>
            <th>Факт</th>
            <th>Δ</th>
            <th>Задач</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.id">
            <td>{{ row.name }}</td>
            <td>{{ row.planLabel }}</td>
            <td>{{ row.actualLabel }}</td>
            <td>
              <span v-if="row.deltaClass" :class="row.deltaClass">{{ row.deltaLabel }}</span>
              <template v-else>{{ row.deltaLabel }}</template>
            </td>
            <td>{{ row.taskCount }}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td>Итого по проекту</td>
            <td>{{ totals.planLabel }}</td>
            <td>{{ totals.actualLabel }}</td>
            <td>{{ totals.deltaLabel }}</td>
            <td>{{ totals.taskCount }}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>

<script setup>
defineProps({
  scope: { type: String, default: 'today' },
  hint: { type: String, default: '' },
  rows: { type: Array, default: () => [] },
  totals: {
    type: Object,
    default: () => ({
      planLabel: '—',
      actualLabel: '—',
      deltaLabel: '—',
      taskCount: 0,
    }),
  },
  onScopeChange: { type: Function, default: null },
})
</script>
