<template>
  <section class="dod-page__form-block">
    <div class="templates-page__section-head">
      <h2>Новый шаблон сделки</h2>
      <button
        v-if="showSeed"
        type="button"
        class="btn-ghost"
        :disabled="isSeeding"
        @click="onSeedClick"
      >
        {{ isSeeding ? 'Добавляем…' : 'Добавить «Onboarding deal»' }}
      </button>
    </div>

    <form class="dod-page__form templates-page__form" @submit.prevent="onSubmit">
      <input
        v-model="name"
        class="glass-input"
        placeholder="Название шаблона (Onboarding deal)"
        maxlength="120"
        required
      />
      <input
        v-model="title"
        class="glass-input"
        placeholder="Заголовок сделки"
        maxlength="200"
      />
      <textarea v-model="description" class="glass-input" placeholder="Описание" rows="4" />
      <input v-model="amount" class="glass-input" type="number" min="0" placeholder="Сумма" />
      <input v-model="contactName" class="glass-input" placeholder="Контакт" maxlength="200" />
      <input v-model="companyName" class="glass-input" placeholder="Компания" maxlength="200" />

      <button type="submit" class="btn-primary" :disabled="isCreating || !name.trim()">
        {{ isCreating ? 'Создаём…' : 'Создать шаблон' }}
      </button>
    </form>

    <p v-if="errorMessage" class="dod-page__error" role="alert">
      {{ errorMessage }}
    </p>
  </section>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  showSeed: { type: Boolean, default: false },
  isCreating: { type: Boolean, default: false },
  isSeeding: { type: Boolean, default: false },
  errorMessage: { type: String, default: '' },
  onCreate: { type: Function, required: true },
  onSeed: { type: Function, required: true },
})

const name = ref('')
const title = ref('')
const description = ref('')
const amount = ref('')
const contactName = ref('')
const companyName = ref('')

async function onSeedClick() {
  try {
    await props.onSeed()
  } catch {
    /* ignore */
  }
}

async function onSubmit() {
  const trimmed = name.value.trim()
  if (!trimmed) return

  const parsedAmount = amount.value.trim() === '' ? undefined : Number(amount.value)
  if (parsedAmount !== undefined && (!Number.isFinite(parsedAmount) || parsedAmount < 0)) {
    return
  }

  try {
    await props.onCreate({
      name: trimmed,
      title: title.value.trim() || undefined,
      description: description.value.trim() || undefined,
      amount: parsedAmount,
      contactName: contactName.value.trim() || undefined,
      companyName: companyName.value.trim() || undefined,
    })
    name.value = ''
    title.value = ''
    description.value = ''
    amount.value = ''
    contactName.value = ''
    companyName.value = ''
  } catch {
    /* ignore */
  }
}
</script>
