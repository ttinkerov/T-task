<template>
  <div v-if="templates.length > 0" class="task-drawer__field">
    <span class="task-drawer__label">
      Шаблон
      <FieldHint
        text="Заполнит пустые поля и добавит теги, сабтаски и DoD из шаблона. Уже заполненные поля не перезаписываются."
      />
    </span>
    <div class="task-checklist__apply" role="group" aria-label="Применить шаблон задачи">
      <select v-model="localTemplateId" aria-label="Шаблон задачи">
        <option value="">Применить шаблон…</option>
        <option v-for="template in templates" :key="template.id" :value="template.id">
          {{ template.name }}
        </option>
      </select>
      <button
        type="button"
        :disabled="!localTemplateId || isPending"
        @click="apply"
      >
        {{ isPending ? '…' : 'Применить' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import FieldHint from '../boards/FieldHint.vue'

const props = defineProps({
  templates: { type: Array, default: () => [] },
  isPending: { type: Boolean, default: false },
  onApply: { type: Function, default: null },
})

const localTemplateId = ref('')

watch(
  () => props.templates,
  () => {
    if (!props.templates.some((item) => item.id === localTemplateId.value)) {
      localTemplateId.value = ''
    }
  },
)

async function apply() {
  if (!localTemplateId.value) return
  try {
    await props.onApply?.(localTemplateId.value)
    localTemplateId.value = ''
  } catch {
    /* handled by React */
  }
}
</script>
