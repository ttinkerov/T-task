<template>
  <p v-if="isLoading || !settings" class="text-sm text-muted-foreground">Загрузка настроек ИИ…</p>

  <div v-else class="settings-card">
    <h2 class="settings-card__title">ИИ</h2>
    <p class="settings-card__text">
      Вставьте API-токен OpenAI-совместимого провайдера (OpenAI, OpenRouter, Groq или свой
      endpoint). Токен хранится только на сервере в зашифрованном виде.
    </p>

    <p v-if="settings.configured" class="settings-card__hint">
      Настроено · {{ settings.provider }} · модель {{ settings.model }} · токен …{{
        settings.tokenLast4
      }}
    </p>
    <p v-else class="settings-card__hint">Токен ещё не задан — чат и помощник недоступны.</p>

    <p v-if="!canManage" class="settings-card__hint">
      Изменить токен могут только администраторы команды.
    </p>

    <form v-else class="ai-settings-form" @submit.prevent="submit">
      <label class="task-drawer__field">
        <span>Провайдер</span>
        <select v-model="provider" class="glass-input">
          <option v-for="option in providerOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </label>

      <label class="task-drawer__field">
        <span>Модель</span>
        <input
          v-model="model"
          class="glass-input"
          placeholder="gpt-4o-mini"
          maxlength="120"
        />
      </label>

      <label v-if="provider === 'CUSTOM'" class="task-drawer__field">
        <span>Base URL</span>
        <input
          v-model="baseUrl"
          class="glass-input"
          placeholder="https://api.example.com/v1"
          required
          maxlength="512"
        />
      </label>

      <label class="task-drawer__field">
        <span>API-токен</span>
        <input
          v-model="apiToken"
          class="glass-input"
          type="password"
          autocomplete="off"
          :placeholder="settings.configured ? '•••• вставьте новый, чтобы заменить' : 'sk-…'"
          required
          minlength="8"
          maxlength="512"
        />
      </label>

      <div class="ai-settings-form__actions">
        <button type="submit" class="btn-primary" :disabled="upsertPending">
          {{ upsertPending ? 'Сохранение…' : 'Сохранить токен' }}
        </button>
        <template v-if="settings.configured">
          <button
            type="button"
            class="btn-ghost"
            :disabled="testPending"
            @click="test"
          >
            Проверить
          </button>
          <button
            type="button"
            class="btn-ghost task-drawer__danger"
            :disabled="deletePending"
            @click="remove"
          >
            Удалить
          </button>
        </template>
      </div>
    </form>

    <p v-if="message" class="settings-card__hint">{{ message }}</p>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  settings: { type: Object, default: null },
  isLoading: { type: Boolean, default: false },
  canManage: { type: Boolean, default: false },
  providerOptions: { type: Array, default: () => [] },
  upsertPending: { type: Boolean, default: false },
  testPending: { type: Boolean, default: false },
  deletePending: { type: Boolean, default: false },
  onSave: { type: Function, default: null },
  onTest: { type: Function, default: null },
  onDelete: { type: Function, default: null },
})

const provider = ref('OPENAI')
const model = ref('gpt-4o-mini')
const baseUrl = ref('')
const apiToken = ref('')
const message = ref('')

watch(
  () => props.settings,
  (settings) => {
    if (!settings) return
    provider.value = settings.provider
    model.value = settings.model
    baseUrl.value = settings.baseUrl ?? ''
  },
  { immediate: true },
)

async function submit() {
  message.value = ''
  try {
    await props.onSave?.({
      provider: provider.value,
      model: model.value.trim() || undefined,
      baseUrl:
        provider.value === 'CUSTOM' || baseUrl.value.trim()
          ? baseUrl.value.trim()
          : undefined,
      apiToken: apiToken.value.trim(),
    })
    apiToken.value = ''
    message.value = 'Токен сохранён. Можно пользоваться чатом и помощником.'
  } catch (error) {
    message.value = error instanceof Error ? error.message : 'Не удалось сохранить'
  }
}

async function test() {
  message.value = ''
  try {
    const result = await props.onTest?.()
    message.value = 'Подключение ок · модель ' + (result?.model || '')
  } catch (error) {
    message.value = error instanceof Error ? error.message : 'Проверка не удалась'
  }
}

async function remove() {
  if (!window.confirm('Удалить сохранённый токен ИИ для этой команды?')) return
  message.value = ''
  try {
    await props.onDelete?.()
    apiToken.value = ''
    message.value = 'Токен удалён.'
  } catch (error) {
    message.value = error instanceof Error ? error.message : 'Не удалось удалить'
  }
}
</script>
