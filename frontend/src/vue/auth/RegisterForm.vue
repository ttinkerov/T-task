<template>
  <form class="space-y-4" @submit.prevent="submit">
    <div class="space-y-1.5">
      <label for="name" class="tt-auth__label">Имя</label>
      <input
        id="name"
        v-model="name"
        required
        class="glass-input"
        autocomplete="name"
      />
    </div>

    <div class="space-y-1.5">
      <label for="email" class="tt-auth__label">Email</label>
      <input
        id="email"
        v-model="email"
        type="email"
        required
        class="glass-input"
        autocomplete="email"
      />
    </div>

    <div class="space-y-1.5">
      <label for="password" class="tt-auth__label">Пароль</label>
      <input
        id="password"
        v-model="password"
        type="password"
        required
        minlength="8"
        class="glass-input"
        autocomplete="new-password"
      />
    </div>

    <p v-if="error" class="text-sm text-red-400">{{ error }}</p>

    <button type="submit" class="btn-primary w-full" :disabled="pending">
      {{ pending ? 'Создание...' : 'Создать аккаунт' }}
    </button>
  </form>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  pending: { type: Boolean, default: false },
  error: { type: String, default: '' },
  onSubmit: { type: Function, default: null },
})

const name = ref('')
const email = ref('')
const password = ref('')

async function submit() {
  await props.onSubmit?.({
    name: name.value,
    email: email.value,
    password: password.value,
  })
}
</script>
