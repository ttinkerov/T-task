<template>
  <p v-if="isLoading" class="text-sm text-muted-foreground">Загрузка настроек...</p>

  <div v-else-if="isError" class="settings-card" role="alert">
    <p class="settings-inline-error">{{ loadError || 'Не удалось загрузить настройки' }}</p>
    <button type="button" class="btn-ghost" @click="onRetryLoad?.()">Повторить</button>
  </div>

  <div v-else class="settings-card">
    <h2 class="settings-card__title">Просроченные задачи</h2>
    <p class="settings-card__text">
      Если дедлайн прошёл, а задача ещё не в «Готово», можно автоматически переносить её на
      следующий день. Счётчик дней просрочки сохраняется для всей команды.
    </p>

    <label class="forms-editor__checkbox">
      <input
        type="checkbox"
        :checked="autoRollOverdue"
        :disabled="!canManage || isPending"
        @change="onToggle()"
      />
      Автоматически переносить просроченные задачи на следующий день
    </label>

    <p v-if="actionError" class="settings-inline-error" role="alert">{{ actionError }}</p>

    <p v-if="!canManage" class="settings-card__hint">
      Изменить настройку могут только администраторы команды.
    </p>
  </div>
</template>

<script setup>
defineProps({
  isLoading: { type: Boolean, default: false },
  isError: { type: Boolean, default: false },
  loadError: { type: String, default: '' },
  actionError: { type: String, default: '' },
  autoRollOverdue: { type: Boolean, default: false },
  canManage: { type: Boolean, default: false },
  isPending: { type: Boolean, default: false },
  onRetryLoad: { type: Function, default: null },
  onToggle: { type: Function, required: true },
})
</script>
