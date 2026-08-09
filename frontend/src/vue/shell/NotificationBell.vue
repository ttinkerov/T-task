<template>
  <div class="notification-bell">
    <button
      type="button"
      class="dashboard-header__icon-btn notification-bell__trigger"
      :disabled="!enabled"
      :aria-label="ariaLabel"
      :aria-expanded="open"
      aria-controls="notification-inbox"
      @click="onToggle?.()"
    >
      <ShellIcon name="bell" :size="16" />
      <span v-if="unreadCount" class="notification-bell__count" aria-hidden="true">
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
    </button>

    <section
      v-if="open"
      id="notification-inbox"
      class="notification-bell__panel"
      aria-label="Уведомления"
    >
      <header>
        <h2>Уведомления</h2>
        <button
          v-if="unreadCount"
          type="button"
          :disabled="markAllPending"
          @click="onMarkAll?.()"
        >
          Прочитать все
        </button>
      </header>

      <p v-if="isLoading" class="notification-bell__empty" role="status">Загрузка…</p>
      <p v-else-if="error" class="notification-bell__error" role="alert">
        Не удалось загрузить уведомления.
        <button type="button" class="board-filters__chip" @click="onRetry?.()">Повторить</button>
      </p>
      <p v-else-if="items.length === 0" class="notification-bell__empty">Здесь пока ничего нет</p>
      <ul v-else class="notification-bell__list" role="list">
        <li v-for="item in items" :key="item.id">
          <button
            type="button"
            :class="{ 'notification-bell__item--unread': !item.read }"
            @click="onOpen?.(item.id)"
          >
            <span class="notification-bell__avatar" aria-hidden="true">{{ item.avatar }}</span>
            <span>
              <span>
                <strong>{{ item.actorName }}</strong>{{ item.actionText }}
              </span>
              <small>{{ item.taskTitle }}</small>
              <em>{{ item.preview }}</em>
              <time :datetime="item.createdAt">{{ item.timeLabel }}</time>
            </span>
          </button>
        </li>
      </ul>
      <p v-if="markAllError" class="notification-bell__error" role="alert">{{ markAllError }}</p>
    </section>
  </div>
</template>

<script setup>
import ShellIcon from './ShellIcon.vue'

defineProps({
  enabled: { type: Boolean, default: false },
  open: { type: Boolean, default: false },
  unreadCount: { type: Number, default: 0 },
  isLoading: { type: Boolean, default: false },
  error: { type: Boolean, default: false },
  markAllPending: { type: Boolean, default: false },
  markAllError: { type: String, default: '' },
  items: { type: Array, default: () => [] },
  ariaLabel: { type: String, default: 'Уведомления' },
  onToggle: { type: Function, default: null },
  onMarkAll: { type: Function, default: null },
  onOpen: { type: Function, default: null },
  onRetry: { type: Function, default: null },
})
</script>
