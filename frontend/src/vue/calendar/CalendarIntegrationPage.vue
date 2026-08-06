<template>
  <section class="calendar-page" aria-labelledby="calendar-page-title">
    <header class="calendar-page__header">
      <div>
        <span class="calendar-page__eyebrow">Личный календарь</span>
        <h1 id="calendar-page-title">Интеграция с календарями</h1>
        <p>
          Подпишите Google, Яндекс, Apple или другой календарь на дедлайны задач, назначенных вам в
          этой команде.
        </p>
      </div>
      <span class="calendar-page__sync-badge">
        <span aria-hidden="true">↻</span>
        Односторонняя синхронизация
      </span>
    </header>

    <p class="sr-only" role="status" aria-live="polite" aria-atomic="true">{{ notice }}</p>

    <div class="calendar-page__grid">
      <article class="calendar-feed" aria-labelledby="calendar-feed-title">
        <div class="calendar-feed__heading">
          <div>
            <span class="calendar-feed__icon" aria-hidden="true">31</span>
            <div>
              <h2 id="calendar-feed-title">Календарь задач</h2>
              <p>Дедлайны отображаются как события на весь день.</p>
            </div>
          </div>

          <span
            v-if="isStatusLoading"
            class="calendar-feed__status"
            role="status"
            aria-live="polite"
          >
            Проверяем…
          </span>
          <span
            v-else-if="enabled"
            class="calendar-feed__status calendar-feed__status--active"
            role="status"
            aria-live="polite"
          >
            <span aria-hidden="true" /> Подключён
          </span>
          <span v-else class="calendar-feed__status" role="status" aria-live="polite">
            Не подключён
          </span>
        </div>

        <p v-if="statusError" class="calendar-feed__error" role="alert">
          Не удалось проверить интеграцию. Обновите страницу и попробуйте снова.
        </p>

        <div v-if="feedUrl" class="calendar-feed__url">
          <label for="calendar-feed-url">Приватная ссылка</label>
          <div>
            <input
              id="calendar-feed-url"
              :value="feedUrl"
              readonly
              spellcheck="false"
              aria-describedby="calendar-feed-url-hint"
            />
            <button type="button" @click="onCopy?.()">Копировать</button>
          </div>
          <p id="calendar-feed-url-hint">
            Сохраните ссылку сейчас: в целях безопасности мы не показываем её повторно.
          </p>
        </div>

        <div v-else-if="enabled" class="calendar-feed__hidden-url">
          <span aria-hidden="true">••••••••</span>
          <p>
            Ссылка скрыта. Её начало: <strong>{{ tokenPrefix }}…</strong>
          </p>
        </div>

        <p v-if="copyError" class="calendar-feed__error" role="alert">{{ copyError }}</p>
        <p v-if="actionError" class="calendar-feed__error" role="alert">
          Не удалось изменить интеграцию. Попробуйте ещё раз.
        </p>

        <div
          v-if="pendingAction"
          class="calendar-feed__confirmation"
          role="group"
          aria-label="Подтверждение"
        >
          <p>
            {{
              pendingAction === 'rotate'
                ? 'Текущая ссылка перестанет работать. Замените её во всех календарях.'
                : 'Подключённые календари больше не смогут обновлять задачи.'
            }}
          </p>
          <div>
            <button
              type="button"
              class="btn btn-primary"
              :disabled="isBusy"
              @click="onConfirmPending?.()"
            >
              {{ pendingAction === 'rotate' ? 'Обновить ссылку' : 'Отключить календарь' }}
            </button>
            <button
              type="button"
              class="btn btn-ghost"
              :disabled="isBusy"
              @click="onCancelPending?.()"
            >
              Отмена
            </button>
          </div>
        </div>

        <div class="calendar-feed__actions">
          <button
            type="button"
            class="btn btn-primary"
            :disabled="isBusy || isStatusLoading || Boolean(pendingAction)"
            @click="onPrimaryAction?.()"
          >
            {{ primaryLabel }}
          </button>
          <a
            v-if="webcalUrl"
            class="btn btn-ghost"
            :href="webcalUrl"
            rel="noopener noreferrer"
          >
            Открыть в приложении
          </a>
          <button
            v-if="enabled"
            type="button"
            class="calendar-feed__revoke"
            :disabled="isBusy || Boolean(pendingAction)"
            @click="onRequestRevoke?.()"
          >
            Отключить
          </button>
        </div>

        <p v-if="enabled && updatedAtLabel" class="calendar-feed__updated">
          Ссылка обновлена {{ updatedAtLabel }}
        </p>

        <aside class="calendar-feed__warning" aria-label="Предупреждение о безопасности">
          <span aria-hidden="true">!</span>
          <p>
            Ссылка открывает названия, описания и дедлайны ваших задач без входа в T-task. Не
            публикуйте её. При утечке сразу обновите или отключите ссылку.
          </p>
        </aside>
      </article>

      <aside class="calendar-providers" aria-labelledby="calendar-providers-title">
        <div class="calendar-providers__heading">
          <span>Подключение</span>
          <h2 id="calendar-providers-title">Добавьте ссылку в свой календарь</h2>
          <p>Обновления подтягиваются календарным сервисом автоматически.</p>
        </div>
        <ol role="list">
          <li v-for="provider in providers" :key="provider.key">
            <span
              class="calendar-provider"
              :class="'calendar-provider--' + provider.key"
              aria-hidden="true"
            >
              <img class="calendar-provider__glyph" :src="provider.iconSrc" alt="" />
            </span>
            <div>
              <strong>{{ provider.name }}</strong>
              <p>{{ provider.instruction }}</p>
            </div>
          </li>
        </ol>
        <p class="calendar-providers__note">
          Изменения из внешнего календаря не меняют задачи в T-task. Google и другие сервисы сами
          определяют интервал обновления подписки.
        </p>
      </aside>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  enabled: { type: Boolean, default: false },
  tokenPrefix: { type: String, default: null },
  updatedAtLabel: { type: String, default: '' },
  isStatusLoading: { type: Boolean, default: false },
  statusError: { type: Boolean, default: false },
  feedUrl: { type: String, default: null },
  webcalUrl: { type: String, default: null },
  notice: { type: String, default: '' },
  copyError: { type: String, default: '' },
  actionError: { type: Boolean, default: false },
  pendingAction: { type: String, default: null },
  isBusy: { type: Boolean, default: false },
  createPending: { type: Boolean, default: false },
  onCopy: { type: Function, default: null },
  onPrimaryAction: { type: Function, default: null },
  onRequestRevoke: { type: Function, default: null },
  onConfirmPending: { type: Function, default: null },
  onCancelPending: { type: Function, default: null },
})

const providers = [
  {
    key: 'google',
    name: 'Google Calendar',
    instruction: 'Настройки → Добавить календарь → Добавить по URL',
    iconSrc: '/icons/calendar/google-calendar.svg',
  },
  {
    key: 'yandex',
    name: 'Яндекс Календарь',
    instruction: 'Новый календарь → По ссылке → вставьте URL',
    iconSrc: '/icons/calendar/yandex.svg',
  },
  {
    key: 'apple',
    name: 'Apple Calendar',
    instruction: 'Файл → Новая подписка на календарь',
    iconSrc: '/icons/calendar/apple-calendar.svg',
  },
  {
    key: 'caldav',
    name: 'Другой календарь',
    instruction: 'Добавьте подписной календарь по URL или через webcal',
    iconSrc: '/icons/calendar/generic-calendar.svg',
  },
]

const primaryLabel = computed(() => {
  if (props.createPending) return 'Создаём…'
  if (props.enabled) return 'Обновить приватную ссылку'
  return 'Создать приватную ссылку'
})
</script>
