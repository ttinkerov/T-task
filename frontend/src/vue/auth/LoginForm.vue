<template>
  <form class="space-y-4" @submit.prevent="submit">
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
      <div class="flex items-center justify-between gap-2">
        <label for="password" class="tt-auth__label">Пароль</label>
        <a href="/forgot-password" class="text-xs text-muted-foreground hover:text-foreground">
          Забыли пароль?
        </a>
      </div>
      <input
        id="password"
        v-model="password"
        type="password"
        required
        minlength="8"
        class="glass-input"
        autocomplete="current-password"
      />
    </div>

    <p v-if="error" class="text-sm text-red-400">{{ error }}</p>

    <button type="submit" class="btn-primary w-full" :disabled="pending">
      {{ pending ? 'Вход...' : 'Войти' }}
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

const email = ref('')
const password = ref('')

async function submit() {
  await props.onSubmit?.({
    email: email.value,
    password: password.value,
  })
}
</script>
