<template>
  <section class="apps-page">
    <header class="apps-page__header">
      <div>
        <span class="apps-page__eyebrow">Рабочее пространство</span>
        <h1>Приложения</h1>
        <p>Google Документы и Таблицы, Figma, Miro и Airtable — рядом с задачами команды.</p>
      </div>
      <div class="apps-page__providers" aria-label="Поддерживаемые сервисы">
        <span v-for="provider in providers" :key="provider.label" :title="provider.label">
          {{ provider.icon }}
        </span>
      </div>
    </header>

    <form
      v-if="canAdd"
      class="apps-create"
      aria-label="Добавить приложение"
      @submit.prevent="submitCreate"
    >
      <label>
        <span>Название</span>
        <input
          class="glass-input"
          maxlength="120"
          placeholder="Например, Макеты приложения"
          required
          :value="title"
          @input="onTitleChange?.($event.target.value)"
        />
      </label>
      <label class="apps-create__url">
        <span>Ссылка на ресурс</span>
        <input
          class="glass-input"
          type="url"
          maxlength="2048"
          placeholder="https://www.figma.com/design/..."
          required
          :value="url"
          @input="onUrlChange?.($event.target.value)"
        />
      </label>
      <button type="submit" class="btn-primary" :disabled="createPending || !canSubmitCreate">
        {{ createPending ? 'Добавление…' : 'Добавить' }}
      </button>
      <p class="apps-create__hint">
        Airtable принимает только публичную embed-ссылку. Доступ к содержимому регулируется
        настройками самого сервиса.
      </p>
      <p v-if="createError" class="apps-create__error" role="alert">{{ createError }}</p>
    </form>

    <p v-if="pageError" class="apps-page__error" role="alert">{{ pageError }}</p>

    <AppsList
      v-if="items.length === 0"
      :items="items"
      :selected-id="selectedId"
      :pending-delete-id="pendingDeleteId"
      :is-deleting="isDeleting"
      :delete-error="deleteError"
      @select="onSelect"
      @request-delete="onRequestDelete"
      @confirm-delete="onConfirmDelete"
      @cancel-delete="onCancelDelete"
    />

    <div v-else class="apps-workspace">
      <AppsList
        :items="items"
        :selected-id="selectedId"
        :pending-delete-id="pendingDeleteId"
        :is-deleting="isDeleting"
        :delete-error="deleteError"
        @select="onSelect"
        @request-delete="onRequestDelete"
        @confirm-delete="onConfirmDelete"
        @cancel-delete="onCancelDelete"
      />

      <div v-if="viewer" class="apps-viewer">
        <div class="apps-viewer__toolbar">
          <div>
            <strong>{{ viewer.title }}</strong>
            <span>{{ viewer.providerLabel }}</span>
          </div>
          <a v-if="viewer.sourceUrl" :href="viewer.sourceUrl" target="_blank" rel="noreferrer">
            Открыть в сервисе ↗
          </a>
        </div>

        <div class="apps-viewer__frame">
          <div v-if="iframeState === 'blocked' || !viewer.embedUrl" class="apps-viewer__fallback">
            <h2>Не удалось встроить ресурс</h2>
            <p>
              Сервис мог запретить встраивание или ссылка недоступна. Откройте его во внешней
              вкладке.
            </p>
            <a
              v-if="viewer.sourceUrl"
              class="btn-primary"
              :href="viewer.sourceUrl"
              target="_blank"
              rel="noreferrer"
            >
              Открыть в сервисе
            </a>
          </div>
          <template v-else>
            <p v-if="iframeState === 'loading'" class="apps-viewer__status">
              Загрузка встроенного просмотра…
            </p>
            <iframe
              :key="viewer.id"
              :src="viewer.embedUrl"
              :title="viewer.title + ' — ' + viewer.providerLabel"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              referrerpolicy="no-referrer"
              allow="clipboard-read; clipboard-write; fullscreen"
              @load="onIframeLoad?.()"
              @error="onIframeError?.()"
            />
          </template>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import AppsList from './AppsList.vue';

const props = defineProps({
  providers: { type: Array, default: () => [] },
  canAdd: { type: Boolean, default: false },
  title: { type: String, default: '' },
  url: { type: String, default: '' },
  createPending: { type: Boolean, default: false },
  createError: { type: String, default: '' },
  pageError: { type: String, default: '' },
  items: { type: Array, default: () => [] },
  selectedId: { type: String, default: null },
  pendingDeleteId: { type: String, default: null },
  isDeleting: { type: Boolean, default: false },
  deleteError: { type: String, default: '' },
  viewer: { type: Object, default: null },
  iframeState: { type: String, default: 'loading' },
  onTitleChange: { type: Function, default: null },
  onUrlChange: { type: Function, default: null },
  onCreate: { type: Function, default: null },
  onSelect: { type: Function, default: null },
  onRequestDelete: { type: Function, default: null },
  onConfirmDelete: { type: Function, default: null },
  onCancelDelete: { type: Function, default: null },
  onIframeLoad: { type: Function, default: null },
  onIframeError: { type: Function, default: null },
});

const canSubmitCreate = computed(() => Boolean(props.title.trim() && props.url.trim()));

function submitCreate() {
  props.onCreate?.();
}
</script>
