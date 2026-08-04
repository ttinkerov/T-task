<template>
  <div class="import-page">
    <header class="import-page__header">
      <h1>Импорт из Jira / CSV</h1>
      <p>
        Экспортируйте задачи в CSV из Jira и загрузите сюда — сопоставим статусы с колонками доски
        и создадим карточки за один проход.
      </p>
    </header>

    <section class="import-page__block">
      <h2>1. Файл</h2>
      <label class="import-page__file">
        <input type="file" accept=".csv,text/csv" @change="onFileChange" />
        <span>{{ fileName || 'Выбрать CSV' }}</span>
      </label>
      <p v-if="parseError" class="import-page__error">{{ parseError }}</p>
      <p v-for="warning in warnings" :key="warning" class="import-page__hint">{{ warning }}</p>
      <p v-if="rowCount > 0" class="import-page__meta">
        Строк: {{ rowCount }} · Статусов: {{ statusCount }}
      </p>
    </section>

    <template v-if="showWizard">
      <section class="import-page__block">
        <h2>2. Статусы → колонки</h2>
        <p v-if="boardLoading" class="import-page__hint">Загружаем доску…</p>
        <ul v-else class="import-page__mappings">
          <li v-for="mapping in mappings" :key="mapping.status">
            <span class="import-page__status">{{ mapping.status }}</span>
            <select
              class="glass-input"
              :value="mapping.columnId || createNewValue"
              @change="onMappingChange(mapping.status, $event.target.value)"
            >
              <option v-for="column in columns" :key="column.id" :value="column.id">
                {{ column.name }}
              </option>
              <option :value="createNewValue">Создать колонку «{{ mapping.status }}»</option>
            </select>
          </li>
        </ul>
      </section>

      <section class="import-page__block">
        <h2>3. Превью</h2>
        <div class="import-page__table-wrap">
          <table class="import-page__table">
            <thead>
              <tr>
                <th>Заголовок</th>
                <th>Статус</th>
                <th>Приоритет</th>
                <th>Исполнитель</th>
                <th>Метки</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in previewRows" :key="row.title + '-' + index">
                <td>{{ row.title }}</td>
                <td>{{ row.status }}</td>
                <td>{{ row.priority }}</td>
                <td>{{ row.assignee }}</td>
                <td>{{ row.labels }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-if="rowCount > previewRows.length" class="import-page__hint">
          Показаны первые {{ previewRows.length }} из {{ rowCount }}
        </p>
      </section>

      <section class="import-page__actions">
        <button
          type="button"
          class="btn-primary"
          :disabled="!allMapped || isImporting || columns.length === 0"
          @click="emit('import')"
        >
          {{ isImporting ? 'Импортируем…' : 'Импортировать ' + rowCount + ' задач' }}
        </button>
        <p v-if="importError" class="import-page__error">{{ importError }}</p>
      </section>
    </template>

    <section v-if="result" class="import-page__block import-page__result">
      <h2>Готово</h2>
      <p>
        Создано: {{ result.created }} · Пропущено: {{ result.skipped }} · Всего: {{ result.total }}
      </p>
      <ul v-if="resultIssues.length > 0" class="import-page__result-list">
        <li v-for="item in resultIssues" :key="item.index + '-' + item.title">
          <strong>{{ item.title || '(строка ' + (item.index + 1) + ')' }}</strong>
          <template v-if="item.reason"> — {{ item.reason }}</template>
          <template v-if="item.warnings && item.warnings.length">
            · {{ item.warnings.join('; ') }}
          </template>
        </li>
      </ul>
      <p v-else class="import-page__hint">Все строки созданы без предупреждений.</p>
    </section>
  </div>
</template>

<script setup>
defineProps({
  fileName: { type: String, default: '' },
  parseError: { type: String, default: '' },
  warnings: { type: Array, default: () => [] },
  rowCount: { type: Number, default: 0 },
  statusCount: { type: Number, default: 0 },
  showWizard: { type: Boolean, default: false },
  boardLoading: { type: Boolean, default: false },
  mappings: { type: Array, default: () => [] },
  columns: { type: Array, default: () => [] },
  createNewValue: { type: String, required: true },
  previewRows: { type: Array, default: () => [] },
  allMapped: { type: Boolean, default: false },
  isImporting: { type: Boolean, default: false },
  importError: { type: String, default: '' },
  result: { type: Object, default: null },
  resultIssues: { type: Array, default: () => [] },
})

const emit = defineEmits(['file-select', 'update-mapping', 'import'])

function onFileChange(event) {
  const file = event.target.files && event.target.files[0]
  event.target.value = ''
  emit('file-select', file || null)
}

function onMappingChange(status, columnValue) {
  emit('update-mapping', { status, columnValue })
}
</script>
