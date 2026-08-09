<template>
  <form class="kanban-add-column" @submit.prevent="submit">
    <span class="kanban-add-column__label">Новая колонка</span>
    <input
      v-model="name"
      placeholder="Название колонки"
      maxlength="80"
      class="kanban-add-column__input"
    />
    <button type="submit" class="kanban-add-column__btn" :disabled="!name.trim() || pending">
      {{ pending ? 'Добавление...' : '+ Добавить колонку' }}
    </button>
    <p v-if="actionError" class="kanban-add-column__error" role="alert">{{ actionError }}</p>
  </form>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  pending: { type: Boolean, default: false },
  actionError: { type: String, default: '' },
  onCreate: { type: Function, default: null },
})

const name = ref('')

async function submit() {
  const next = name.value.trim()
  if (!next) return
  try {
    await props.onCreate?.(next)
    name.value = ''
  } catch {
  }
}
</script>
