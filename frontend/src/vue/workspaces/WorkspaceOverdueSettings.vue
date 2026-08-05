<template>
  <p v-if="isLoading" class="text-sm text-muted-foreground">Загрузка настроек...</p>

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

    <p v-if="!canManage" class="settings-card__hint">
      Изменить настройку могут только администраторы команды.
    </p>
  </div>
</template>

<script setup>
defineProps({
  isLoading: { type: Boolean, default: false },
  autoRollOverdue: { type: Boolean, default: false },
  canManage: { type: Boolean, default: false },
  isPending: { type: Boolean, default: false },
  onToggle: { type: Function, required: true },
})
</script>
