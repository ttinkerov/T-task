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
        {{ isPending ? 'Создание…' : 'Создать приглашение' }}
      </button>
    </div>

    <label class="forms-editor__checkbox">
      <input v-model="sendEmail" type="checkbox" />
      Отправить письмо (если SMTP настроен)
    </label>

    <p v-if="errorMessage" class="text-sm text-red-400">{{ errorMessage }}</p>

    <div v-if="inviteLink" class="space-y-2">
      <p class="break-all text-sm text-muted-foreground">Ссылка приглашения: {{ inviteLink }}</p>
      <button type="button" class="btn-ghost" @click="copyLink">
        {{ copied ? 'Скопировано' : 'Скопировать ссылку' }}
      </button>
      <p v-if="emailHint" class="text-sm text-muted-foreground">{{ emailHint }}</p>
    </div>
  </form>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  roleOptions: { type: Array, required: true },
  isPending: { type: Boolean, default: false },
  errorMessage: { type: String, default: '' },
  inviteLink: { type: String, default: '' },
  emailHint: { type: String, default: '' },
  onInvite: { type: Function, required: true },
})

const email = ref('')
const role = ref('MEMBER')
const sendEmail = ref(true)
const copied = ref(false)

async function onSubmit() {
  const trimmed = email.value.trim()
  if (!trimmed) return

  copied.value = false
  try {
    await props.onInvite({ email: trimmed, role: role.value, sendEmail: sendEmail.value })
    email.value = ''
  } catch {
    /* ignore */
  }
}

async function copyLink() {
  if (!props.inviteLink) return
  try {
    await navigator.clipboard.writeText(props.inviteLink)
    copied.value = true
  } catch {
    copied.value = false
  }
}
</script>
