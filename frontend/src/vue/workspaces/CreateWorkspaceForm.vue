<template>
  <form class="flex flex-wrap gap-2" @submit.prevent="onSubmit">
    <input
      v-model="name"
      required
      placeholder="Название новой команды"
      class="glass-input min-w-[220px] flex-1"
    />
    <button type="submit" class="btn-ghost" :disabled="isPending">
      {{ isPending ? 'Создание...' : 'Создать команду' }}
    </button>
  </form>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  isPending: { type: Boolean, default: false },
  onCreate: { type: Function, required: true },
})

const name = ref('')

async function onSubmit() {
  const trimmed = name.value.trim()
  if (!trimmed) return

  try {
    await props.onCreate({ name: trimmed })
    name.value = ''
  } catch {
    /* ignore */
  }
}
</script>
