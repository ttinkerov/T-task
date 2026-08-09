<template>
  <section
    class="task-checklist"
    :class="{ 'task-checklist--blocking': requiredOpen > 0 }"
    aria-labelledby="task-checklist-title"
  >
    <div class="task-checklist__header">
      <h3 id="task-checklist-title" class="task-drawer__section-title">
        Definition of Done
        <FieldHint text="Критерии готовности. Обязательные пункты блокируют перевод в «Готово»." />
      </h3>
      <span>
        {{ completed }}/{{ items.length
        }}{{ requiredOpen > 0 ? ' · ' + requiredOpen + ' обяз.' : '' }}
      </span>
    </div>

    <p v-if="isLoading" role="status">Загрузка DoD...</p>

    <div v-if="templates.length > 0" class="task-checklist__apply">
      <select v-model="templateId" aria-label="Шаблон DoD">
        <option value="">Применить шаблон…</option>
        <option v-for="template in templates" :key="template.id" :value="template.id">
          {{ template.name }}
        </option>
      </select>
      <button
        type="button"
        :disabled="!templateId || applyPending"
        @click="applyTemplate"
      >
        Применить
      </button>
    </div>

    <ul class="task-checklist__list" role="list">
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

    <form class="task-checklist__create" @submit.prevent="submit">
      <input
        v-model="text"
        placeholder="Новый пункт DoD"
        maxlength="200"
        aria-label="Текст пункта DoD"
      />
      <button type="submit" :disabled="createPending || !text.trim()">Добавить</button>
    </form>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import FieldHint from './FieldHint.vue'

const props = defineProps({
  items: { type: Array, default: () => [] },
  templates: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false },
  createPending: { type: Boolean, default: false },
  updatePending: { type: Boolean, default: false },
  deletePending: { type: Boolean, default: false },
  applyPending: { type: Boolean, default: false },
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
    /* ignore */
  }
}

async function applyTemplate() {
  if (!templateId.value) return
  try {
    await props.onApplyTemplate?.(templateId.value)
    templateId.value = ''
  } catch {
    /* ignore */
  }
}
</script>
