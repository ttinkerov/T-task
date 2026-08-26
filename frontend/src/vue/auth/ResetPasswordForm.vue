<template>
  <form class="space-y-4" @submit.prevent="submit">
    <div class="space-y-1.5">
      <label for="reset-password" class="tt-auth__label">Новый пароль</label>
      <input
        id="reset-password"
        v-model="password"
        type="password"
        required
        minlength="8"
        class="glass-input"
        autocomplete="new-password"
      />
    </div>

    <div class="space-y-1.5">
      <label for="reset-password-confirm" class="tt-auth__label">Повторите пароль</label>
      <input
        id="reset-password-confirm"
        v-model="confirm"
        type="password"
        required
        minlength="8"
        class="glass-input"
        autocomplete="new-password"
      />
    </div>

    <p class="text-xs text-muted-foreground">
      Не меньше 8 символов, с заглавной, строчной буквой и цифрой.
    </p>

    <p v-if="localError || error" class="text-sm text-red-400" role="alert">
      {{ localError || error }}
    </p>
    <p v-if="success" class="text-sm text-muted-foreground" role="status">{{ success }}</p>

    <button type="submit" class="btn-primary w-full" :disabled="pending">
      {{ pending ? 'Сохранение…' : 'Сохранить пароль' }}
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

const password = ref('')
const confirm = ref('')
const localError = ref('')

async function submit() {
  localError.value = ''
  if (password.value !== confirm.value) {
    localError.value = 'Пароли не совпадают'
    return
  }
  await props.onSubmit?.({ password: password.value })
}
</script>
