<template>
  <section class="dod-page__form-block">
    <h2>Новый шаблон</h2>

    <form class="dod-page__form" @submit.prevent="onSubmit">
      <input
        v-model="name"
        class="glass-input"
        placeholder="Название шаблона"
        maxlength="120"
        required
      />
      <textarea
        v-model="itemsText"
        class="glass-input"
        placeholder="Пункты — по одному в строке&#10;Тесты&#10;Code review&#10;Документация"
        rows="5"
      />
      <label class="dod-page__toggle">
        <input v-model="gatesCompletion" type="checkbox" />
        Блокировать завершение, пока пункты не отмечены
      </label>
      <button type="submit" class="btn-primary" :disabled="isCreating || !name.trim()">
        Создать
      </button>
    </form>

    <p v-if="errorMessage" class="dod-page__error">{{ errorMessage }}</p>
  </section>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  isCreating: { type: Boolean, default: false },
  errorMessage: { type: String, default: '' },
  onCreate: { type: Function, required: true },
})

const name = ref('')
const itemsText = ref('')
const gatesCompletion = ref(true)

function splitLines(value) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

async function onSubmit() {
  const trimmed = name.value.trim()
  if (!trimmed) return

  try {
    await props.onCreate({
      name: trimmed,
      gatesCompletion: gatesCompletion.value,
      items: splitLines(itemsText.value),
    })
    name.value = ''
    itemsText.value = ''
    gatesCompletion.value = true
  } catch {
    /* ignore */
  }
}
</script>
