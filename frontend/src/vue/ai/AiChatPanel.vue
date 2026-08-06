<template>
  <p v-if="isLoading" class="text-sm text-muted-foreground">Загрузка…</p>

  <div v-else-if="!configured" class="ai-chat ai-chat--empty">
    <h1 class="ai-chat__title">ИИ-чат</h1>
    <p class="ai-chat__lead">
      Чтобы начать, администратор команды вставляет API-токен в настройках.
    </p>
    <a :href="settingsHref" class="btn-primary">Открыть настройки</a>
  </div>

  <div v-else class="ai-chat">
    <header class="ai-chat__header">
      <div>
        <h1 class="ai-chat__title">ИИ-чат</h1>
        <p class="ai-chat__meta">{{ provider }} · {{ model }}</p>
      </div>
      <button type="button" class="btn-ghost" @click="clear">Очистить</button>
    </header>

    <div ref="listRef" class="ai-chat__messages">
      <p v-if="messages.length === 0" class="ai-chat__placeholder">
        Спросите про приоритизацию, формулировку задач или план спринта.
      </p>
      <div
        v-for="(message, index) in messages"
        :key="message.role + '-' + index"
        class="ai-chat__bubble"
        :class="'ai-chat__bubble--' + message.role"
      >
        <span class="ai-chat__role">{{ message.role === 'user' ? 'Вы' : 'ИИ' }}</span>
        <p>{{ message.content }}</p>
      </div>
      <p v-if="isPending" class="ai-chat__placeholder">Думаю…</p>
    </div>

    <p v-if="error" class="ai-chat__error">{{ error }}</p>

    <form class="ai-chat__composer" @submit.prevent="submit">
      <textarea
        v-model="input"
        class="glass-input ai-chat__input"
        rows="2"
        maxlength="8000"
        placeholder="Напишите сообщение…"
        :disabled="isPending"
      />
      <button type="submit" class="btn-primary" :disabled="isPending || !input.trim()">
        Отправить
      </button>
    </form>
  </div>
</template>

<script setup>
import { nextTick, ref, watch } from 'vue'

const props = defineProps({
  isLoading: { type: Boolean, default: false },
  configured: { type: Boolean, default: false },
  provider: { type: String, default: '' },
  model: { type: String, default: '' },
  settingsHref: { type: String, default: '' },
  isPending: { type: Boolean, default: false },
  onSend: { type: Function, default: null },
})

const messages = ref([])
const input = ref('')
const error = ref('')
const listRef = ref(null)

watch(
  () => [messages.value.length, props.isPending],
  async () => {
    await nextTick()
    const el = listRef.value
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  },
)

function clear() {
  messages.value = []
  error.value = ''
}

async function submit() {
  const content = input.value.trim()
  if (!content || props.isPending) return

  const nextMessages = [...messages.value, { role: 'user', content }]
  messages.value = nextMessages
  input.value = ''
  error.value = ''

  try {
    const reply = await props.onSend?.(nextMessages.slice(-20))
    messages.value = [...nextMessages, { role: 'assistant', content: reply }]
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Не удалось получить ответ'
  }
}
</script>
