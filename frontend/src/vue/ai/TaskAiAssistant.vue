<template>
  <div v-if="configured" class="task-ai">
    <button type="button" class="btn-ghost task-ai__toggle" @click="open = !open">
      {{ open ? 'Скрыть ИИ-помощника' : 'Спросить ИИ' }}
    </button>

    <div v-if="open" class="task-ai__panel">
      <div class="task-ai__prompts">
        <button
          v-for="prompt in quickPrompts"
          :key="prompt"
          type="button"
          class="btn-ghost task-ai__chip"
          :disabled="isPending"
          @click="ask(prompt)"
        >
          {{ prompt }}
        </button>
      </div>

      <div class="task-ai__messages">
        <div
          v-for="(message, index) in messages"
          :key="message.role + '-' + index"
          class="task-ai__msg"
          :class="'task-ai__msg--' + message.role"
        >
          <strong>{{ message.role === 'user' ? 'Вы' : 'ИИ' }}</strong>
          <p>{{ message.content }}</p>
        </div>
        <p v-if="isPending" class="settings-card__hint">Думаю…</p>
      </div>

      <p v-if="error" class="ai-chat__error">{{ error }}</p>

      <form class="task-ai__composer" @submit.prevent="submit">
        <input
          v-model="input"
          class="glass-input"
          placeholder="Вопрос по этой задаче…"
          maxlength="2000"
          :disabled="isPending"
        />
        <button type="submit" class="btn-primary" :disabled="isPending || !input.trim()">
          →
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  configured: { type: Boolean, default: false },
  isPending: { type: Boolean, default: false },
  quickPrompts: { type: Array, default: () => [] },
  onAsk: { type: Function, default: null },
})

const open = ref(false)
const messages = ref([])
const input = ref('')
const error = ref('')

async function ask(prompt) {
  const content = String(prompt || '').trim()
  if (!content || props.isPending) return

  const nextMessages = [...messages.value, { role: 'user', content }]
  messages.value = nextMessages
  error.value = ''

  try {
    const reply = await props.onAsk?.(nextMessages.slice(-20))
    messages.value = [...nextMessages, { role: 'assistant', content: reply }]
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Ошибка ИИ'
  }
}

async function submit() {
  const content = input.value.trim()
  if (!content) return
  input.value = ''
  await ask(content)
}
</script>
