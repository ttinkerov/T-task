<template>
  <section
    v-if="isLoading || definitions.length > 0"
    class="task-custom-fields"
    aria-labelledby="task-custom-fields-title"
  >
    <h3 id="task-custom-fields-title" class="task-drawer__section-title">
      Кастомные поля
      <FieldHint text="Дополнительные поля команды: текст, число, дата, список и т.д." />
    </h3>

    <p v-if="isLoading" class="text-sm text-muted-foreground" role="status">Загрузка полей…</p>

    <div v-else class="task-custom-fields__list">
      <CustomFieldEditor
        v-for="definition in definitions"
        :key="definition.id"
        :definition="definition"
        :value="valueMap[definition.id] ?? null"
        :members="members"
        :disabled="pendingId === definition.id"
        :on-save="(value) => onSave?.(definition.id, value)"
      />
    </div>

    <p v-if="error" class="task-custom-fields__error" role="alert">{{ error }}</p>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import CustomFieldEditor from './CustomFieldEditor.vue'
import FieldHint from './FieldHint.vue'

const props = defineProps({
  definitions: { type: Array, default: () => [] },
  values: { type: Array, default: () => [] },
  members: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false },
  pendingId: { type: String, default: null },
  error: { type: String, default: '' },
  onSave: { type: Function, default: null },
})

const valueMap = computed(() => {
  const map = {}
  for (const entry of props.values) {
    map[entry.fieldId] = entry.value
  }
  return map
})
</script>
