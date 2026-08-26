<template>
  <form class="space-y-4" @submit.prevent="submit">
    <p class="text-sm text-muted-foreground">
      Укажите email — если аккаунт есть, пришлём ссылку для сброса пароля.
    </p>

    <div class="space-y-1.5">
      <label for="forgot-email" class="tt-auth__label">Email</label>
      <input
        id="forgot-email"
        v-model="email"
        type="email"
        required
        class="glass-input"
        autocomplete="email"
      />
    </div>

    <p v-if="error" class="text-sm text-red-400" role="alert">{{ error }}</p>
    <p v-if="success" class="text-sm text-muted-foreground" role="status">{{ success }}</p>

    <button type="submit" class="btn-primary w-full" :disabled="pending">
      {{ pending ? 'Отправка…' : 'Отправить ссылку' }}
    </button>
  </form>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  pending: { type: Boolean, default: false },
  error: { type: String, default: '' },
  success: { type: String, default: '' },
  onSubmit: { type: Function, default: null },
})

const email = ref('')

async function submit() {
  await props.onSubmit?.({ email: email.value.trim() })
}
</script>
