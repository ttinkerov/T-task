<template>
  <section
    class="task-checklist"
    :class="{ 'task-checklist--blocking': requiredOpen > 0 }"
    aria-labelledby="task-checklist-title"
  >
    <div class="task-checklist__header">
      <h3 id="task-checklist-title" class="task-drawer__section-title">
        Критерии готовности
        <FieldHint text="Критерии готовности. Обязательные пункты блокируют перевод в «Готово»." />
      </h3>
      <span>
        {{ completed }}/{{ items.length
        }}{{ requiredOpen > 0 ? ' · ' + requiredOpen + ' обяз.' : '' }}
      </span>
    </div>

    <p v-if="isLoading" role="status">Загрузка чеклиста...</p>

    <div v-else-if="loadError" role="alert">
      <p class="text-sm text-red-400">{{ loadError }}</p>
      <button type="button" class="btn-ghost" @click="onRetryLoad?.()">Повторить</button>
    </div>

    <div v-if="!loadError && templates.length > 0" class="task-checklist__apply">
      <select v-model="templateId" aria-label="Шаблон критериев готовности">
        <option value="">Применить шаблон…</option>
        <option v-for="template in templates" :key="template.id" :value="template.id">
          {{ template.name }}
        </option>
      </select>
      <button type="button" :disabled="!templateId || applyPending" @click="applyTemplate">
        Применить
      </button>
    </div>

    <ul v-if="!loadError" class="task-checklist__list" role="list">
      <li v-for="item in items" :key="item.id">
        <label>
          <input
            type="checkbox"
            :checked="item.completed"
            :disabled="updatePending"
            @change="onToggle?.(item.id, $event.target.checked)"
          />
          <span :class="{ 'is-done': item.completed }">
            {{ item.text }}
            <em v-if="item.required" title="Обязательный">*</em>
          </span>
        </label>
        <button
          type="button"
          :aria-label="'Удалить пункт ' + item.text"
          :disabled="deletePending"
          @click="onDelete?.(item.id)"
        >
          ×
        </button>
      </li>
    </ul>

    <form v-if="!loadError" class="task-checklist__create" @submit.prevent="submit">
      <input
        v-model="text"
        placeholder="Новый пункт"
        maxlength="200"
        aria-label="Текст пункта чеклиста"
      />
      <button type="submit" :disabled="createPending || !text.trim()">Добавить</button>
    </form>

    <p v-if="actionError" class="text-sm text-red-400" role="alert">{{ actionError }}</p>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import FieldHint from './FieldHint.vue'

const props = defineProps({
  items: { type: Array, default: () => [] },
  templates: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false },
  loadError: { type: String, default: '' },
  actionError: { type: String, default: '' },
  createPending: { type: Boolean, default: false },
  updatePending: { type: Boolean, default: false },
  deletePending: { type: Boolean, default: false },
  applyPending: { type: Boolean, default: false },
  onRetryLoad: { type: Function, default: null },
  onToggle: { type: Function, default: null },
  onDelete: { type: Function, default: null },
  onCreate: { type: Function, default: null },
  onApplyTemplate: { type: Function, default: null },
})

const text = ref('')
const templateId = ref('')

const completed = computed(() => props.items.filter((item) => item.completed).length)
const requiredOpen = computed(
  () => props.items.filter((item) => item.required && !item.completed).length,
)

async function submit() {
  const trimmed = text.value.trim()
  if (!trimmed) return
  try {
    await props.onCreate?.(trimmed)
    text.value = ''
  } catch {
  }
}

async function applyTemplate() {
  if (!templateId.value) return
  try {
    await props.onApplyTemplate?.(templateId.value)
    templateId.value = ''
  } catch {
  }
}
</script>
