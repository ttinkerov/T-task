<template>
  <div class="kanban-column__add-wrap">
    <form class="kanban-column__add" @submit.prevent="submit">
      <select
        v-if="templates.length"
        class="kanban-column__add-template"
        :value="templateId"
        aria-label="Шаблон задачи"
        @change="onTemplateChange"
      >
        <option value="">Без шаблона</option>
        <option v-for="template in templates" :key="template.id" :value="template.id">
          {{ template.name }}
        </option>
      </select>

      <input
        :value="title"
        placeholder="Задача..."
        class="kanban-column__add-input"
        @input="title = $event.target.value"
      />

      <button
        type="submit"
        class="kanban-column__add-btn"
        aria-label="Добавить задачу"
        :disabled="pending || !canSubmit"
      >
        +
      </button>
    </form>
    <p v-if="actionError" class="kanban-column__add-error" role="alert">{{ actionError }}</p>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  templates: { type: Array, default: () => [] },
  pending: { type: Boolean, default: false },
  actionError: { type: String, default: '' },
  onCreate: { type: Function, default: null },
})

const title = ref('')
const templateId = ref('')

const canSubmit = computed(() => {
  if (title.value.trim()) return true
  const selected = props.templates.find((template) => template.id === templateId.value)
  return Boolean(selected?.title?.trim())
})

function onTemplateChange(event) {
  const nextId = event.target.value
  templateId.value = nextId
  const selected = props.templates.find((template) => template.id === nextId)
  if (selected?.title && !title.value.trim()) {
    title.value = selected.title
  }
}

async function submit() {
  const selected = props.templates.find((template) => template.id === templateId.value)
  const nextTitle = title.value.trim() || selected?.title?.trim() || ''
  if (!nextTitle) return
  try {
    await props.onCreate?.({
      title: nextTitle,
      templateId: templateId.value || undefined,
    })
    title.value = ''
    templateId.value = ''
  } catch {
  }
}
</script>
