<template>
  <p v-if="isLoading" class="settings-card__hint">Загрузка настроек ИИ…</p>

  <div v-else-if="isError" class="settings-card" data-testid="ai-settings-load-error">
    <h2 class="settings-card__title">ИИ</h2>
    <p class="ai-settings-form__error" role="alert">
      {{ loadError || 'Не удалось загрузить настройки ИИ' }}
    </p>
    <button type="button" class="btn-ghost" @click="onRetryLoad?.()">Повторить</button>
  </div>

  <div v-else-if="settings" class="settings-card" data-testid="ai-settings-card">
    <h2 class="settings-card__title">ИИ</h2>
    <p class="settings-card__text">
      Чат может быть любым OpenAI-совместимым API (в т.ч. DeepSeek). Для RAG нужен провайдер с
      /embeddings — отдельно ниже или тот же ключ OpenAI/OpenRouter.
    </p>

    <p v-if="settings.configured" class="settings-card__hint">
      Чат · {{ settings.provider }} · {{ settings.model }} · токен …{{ settings.tokenLast4 }}
    </p>
    <p v-else class="settings-card__hint">Токен чата ещё не задан.</p>

    <div class="ai-rag-status" data-testid="ai-rag-status">
      <p v-if="ragLoading" class="settings-card__hint">Загрузка статуса RAG…</p>
      <p v-else-if="ragError" class="settings-card__hint" role="alert">
        {{ ragError }}
        <button type="button" class="btn-ghost" @click="onRetryRag?.()">Повторить</button>
      </p>
      <template v-else-if="ragStatus">
        <p class="settings-card__hint">
          RAG:
          {{
            ragStatus.ragAvailable
              ? 'доступен (' +
                (ragStatus.embeddingProvider || '') +
                ' · ' +
                ragStatus.embeddingModel +
                ')'
              : 'недоступен — нужен OpenAI/OpenRouter для чата или отдельный embedding-ключ'
          }}
          · чанков: {{ ragStatus.indexedChunks }}
          <template v-if="ragStatus.lastIndexedAt">
            · {{ formatDate(ragStatus.lastIndexedAt) }}
          </template>
        </p>
        <button
          v-if="canManage && settings.configured && ragStatus.ragAvailable"
          type="button"
          class="btn-ghost"
          data-testid="ai-rag-reindex"
          :disabled="reindexPending"
          @click="reindex"
        >
          {{ reindexPending ? 'Индексация…' : 'Переиндексировать RAG' }}
        </button>
      </template>
    </div>

    <p v-if="!canManage" class="settings-card__hint">
      Изменить токен могут только администраторы команды.
    </p>

    <form v-else class="ai-settings-form" @submit.prevent="submit">
      <h3 class="ai-settings-form__section">Чат</h3>
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
        <input v-model="model" class="glass-input" placeholder="gpt-4o-mini" maxlength="120" />
      </label>

      <label v-if="provider === 'CUSTOM'" class="task-drawer__field">
        <span>Адрес API</span>
        <input
          v-model="baseUrl"
          class="glass-input"
          placeholder="https://api.deepseek.com"
          required
          maxlength="512"
        />
      </label>

      <label class="task-drawer__field">
        <span>API-токен чата</span>
        <input
          v-model="apiToken"
          class="glass-input"
          type="password"
          autocomplete="off"
          :placeholder="settings.configured ? '•••• новый токен чата' : 'sk-…'"
          required
          minlength="8"
          maxlength="512"
        />
      </label>

      <h3 class="ai-settings-form__section">RAG embeddings (опционально)</h3>
      <p class="settings-card__hint">
        Если чат — DeepSeek/Groq/CUSTOM без embeddings, укажите здесь OpenAI или OpenRouter.
      </p>

      <label class="task-drawer__field">
        <span>Embedding-провайдер</span>
        <select v-model="embeddingProvider" class="glass-input">
          <option value="">Не задан (наследовать от чата, если возможно)</option>
          <option
            v-for="option in embeddingProviderOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </label>

      <label class="task-drawer__field">
        <span>Embedding-модель</span>
        <input
          v-model="embeddingModel"
          class="glass-input"
          placeholder="text-embedding-3-small"
          maxlength="120"
        />
      </label>

      <label v-if="embeddingProvider === 'CUSTOM'" class="task-drawer__field">
        <span>Адрес embedding API</span>
        <input
          v-model="embeddingBaseUrl"
          class="glass-input"
          placeholder="https://api.openai.com/v1"
          maxlength="512"
        />
      </label>

      <label class="task-drawer__field">
        <span>Embedding API-токен</span>
        <input
          v-model="embeddingApiToken"
          class="glass-input"
          type="password"
          autocomplete="off"
          :placeholder="
            settings.embeddingConfigured ? '•••• новый embedding-токен' : 'оставьте пустым или sk-…'
          "
          minlength="8"
          maxlength="512"
        />
      </label>

      <label v-if="settings.embeddingConfigured" class="task-drawer__field">
        <span>
          <input v-model="clearEmbedding" type="checkbox" />
          Удалить отдельный embedding-ключ
        </span>
      </label>

      <div class="ai-settings-form__actions">
        <button type="submit" class="btn-primary" :disabled="upsertPending">
          {{ upsertPending ? 'Сохранение…' : 'Сохранить' }}
        </button>
        <template v-if="settings.configured">
          <button type="button" class="btn-ghost" :disabled="testPending" @click="test">
            Проверить чат
          </button>
          <button
            type="button"
            class="btn-ghost task-drawer__danger"
            :disabled="deletePending"
            @click="remove"
          >
            Удалить всё
          </button>
        </template>
      </div>
    </form>

    <p
      v-if="message"
      class="ai-settings-form__feedback"
      :class="messageTone === 'error' ? 'ai-settings-form__feedback--error' : 'ai-settings-form__feedback--ok'"
      :role="messageTone === 'error' ? 'alert' : undefined"
    >
      {{ message }}
    </p>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  settings: { type: Object, default: null },
  isLoading: { type: Boolean, default: false },
  isError: { type: Boolean, default: false },
  loadError: { type: String, default: '' },
  onRetryLoad: { type: Function, default: null },
  canManage: { type: Boolean, default: false },
  providerOptions: { type: Array, default: () => [] },
  embeddingProviderOptions: { type: Array, default: () => [] },
  upsertPending: { type: Boolean, default: false },
  testPending: { type: Boolean, default: false },
  deletePending: { type: Boolean, default: false },
  ragStatus: { type: Object, default: null },
  ragLoading: { type: Boolean, default: false },
  ragError: { type: String, default: '' },
  reindexPending: { type: Boolean, default: false },
  onSave: { type: Function, default: null },
  onTest: { type: Function, default: null },
  onDelete: { type: Function, default: null },
  onReindex: { type: Function, default: null },
  onRetryRag: { type: Function, default: null },
});

const provider = ref('OPENAI');
const model = ref('gpt-4o-mini');
const baseUrl = ref('');
const apiToken = ref('');
const embeddingProvider = ref('');
const embeddingModel = ref('text-embedding-3-small');
const embeddingBaseUrl = ref('');
const embeddingApiToken = ref('');
const clearEmbedding = ref(false);
const message = ref('');
const messageTone = ref('ok');

watch(
  () => props.settings,
  (settings) => {
    if (!settings) return;
    provider.value = settings.provider;
    model.value = settings.model;
    baseUrl.value = settings.baseUrl ?? '';
    embeddingProvider.value = settings.embeddingProvider ?? '';
    embeddingModel.value = settings.embeddingModel ?? 'text-embedding-3-small';
    embeddingBaseUrl.value = settings.embeddingBaseUrl ?? '';
    clearEmbedding.value = false;
  },
  { immediate: true },
);

function formatDate(value) {
  try {
    return new Date(value).toLocaleString('ru-RU');
  } catch {
    /* ignore */
    return value;
  }
}

function setMessage(text, tone = 'ok') {
  message.value = text;
  messageTone.value = tone;
}

async function submit() {
  setMessage('');
  try {
    const payload = {
      provider: provider.value,
      model: model.value.trim() || undefined,
      baseUrl:
        provider.value === 'CUSTOM' || baseUrl.value.trim() ? baseUrl.value.trim() : undefined,
      apiToken: apiToken.value.trim(),
    };

    if (clearEmbedding.value) {
      payload.clearEmbedding = true;
    } else if (embeddingProvider.value) {
      payload.embeddingProvider = embeddingProvider.value;
      payload.embeddingModel = embeddingModel.value.trim() || undefined;
      payload.embeddingBaseUrl =
        embeddingProvider.value === 'CUSTOM' || embeddingBaseUrl.value.trim()
          ? embeddingBaseUrl.value.trim()
          : undefined;
      if (embeddingApiToken.value.trim()) {
        payload.embeddingApiToken = embeddingApiToken.value.trim();
      }
    }

    await props.onSave?.(payload);
    apiToken.value = '';
    embeddingApiToken.value = '';
    clearEmbedding.value = false;
    setMessage('Сохранено.');
  } catch (error) {
    setMessage(error instanceof Error ? error.message : 'Не удалось сохранить', 'error');
  }
}

async function test() {
  setMessage('');
  try {
    const result = await props.onTest?.();
    setMessage('Чат ок · модель ' + (result?.model || ''));
  } catch (error) {
    setMessage(error instanceof Error ? error.message : 'Проверка не удалась', 'error');
  }
}

async function remove() {
  if (!window.confirm('Удалить настройки ИИ для этой команды?')) return;
  setMessage('');
  try {
    await props.onDelete?.();
    apiToken.value = '';
    embeddingApiToken.value = '';
    setMessage('Удалено.');
  } catch (error) {
    setMessage(error instanceof Error ? error.message : 'Не удалось удалить', 'error');
  }
}

async function reindex() {
  setMessage('');
  try {
    const result = await props.onReindex?.();
    setMessage(
      'RAG переиндексирован · задач ' +
        (result?.tasks ?? 0) +
        ', комментариев ' +
        (result?.comments ?? 0),
    );
  } catch (error) {
    setMessage(error instanceof Error ? error.message : 'Не удалось переиндексировать', 'error');
  }
}
</script>
