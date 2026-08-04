<template>
  <form class="space-y-3" @submit.prevent="onSubmit">
    <div class="settings-invite-grid">
      <input
        v-model="email"
        type="email"
        required
        placeholder="email@company.com"
        class="glass-input"
      />
      <select v-model="role" class="glass-input">
        <option v-for="option in roleOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
      <button type="submit" class="btn-primary" :disabled="isPending">
        {{ isPending ? 'Отправка...' : 'Пригласить' }}
      </button>
    </div>

    <p v-if="errorMessage" class="text-sm text-red-400">{{ errorMessage }}</p>
    <p v-if="inviteLink" class="break-all text-sm text-muted-foreground">
      Ссылка приглашения: {{ inviteLink }}
    </p>
  </form>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  roleOptions: { type: Array, required: true },
  isPending: { type: Boolean, default: false },
  errorMessage: { type: String, default: '' },
  inviteLink: { type: String, default: '' },
  onInvite: { type: Function, required: true },
})

const email = ref('')
const role = ref('MEMBER')

async function onSubmit() {
  const trimmed = email.value.trim()
  if (!trimmed) return

  try {
    await props.onInvite({ email: trimmed, role: role.value })
    email.value = ''
  } catch {
    /* errorMessage from React */
  }
}
</script>
