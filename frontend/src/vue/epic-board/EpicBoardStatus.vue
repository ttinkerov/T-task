<template>
  <p v-if="status === 'loading-epics'" class="text-sm text-muted-foreground">Загружаем эпики…</p>
  <div v-else-if="status === 'load-error'" role="alert">
    <p class="epic-board__error">{{ loadError || 'Не удалось загрузить доску эпиков' }}</p>
    <button type="button" class="btn-ghost" @click="onRetryLoad?.()">Повторить</button>
  </div>
  <p v-else-if="status === 'no-epics'" class="epic-board__empty">
    Отметьте задачу как эпик в карточке — здесь появятся её стикеры.
  </p>
  <p v-else-if="status === 'loading-children'" class="text-sm text-muted-foreground">
    Загружаем задачи эпика…
  </p>
  <template v-else-if="status === 'ready'">
    <p v-if="boardName" class="epic-board__subtitle">
      Доска «{{ boardName }}» · перетащите стикер между колонками
    </p>
    <p v-if="foreignCount > 0" class="epic-board__note" role="status">
      Ещё {{ foreignCount }} задач(и) эпика на других досках — здесь только текущая доска.
    </p>
    <p v-if="moveError" class="epic-board__error" role="alert">{{ moveError }}</p>
  </template>
</template>

<script setup>
defineProps({
  status: { type: String, default: 'loading-epics' },
  boardName: { type: String, default: '' },
  foreignCount: { type: Number, default: 0 },
  moveError: { type: String, default: '' },
  loadError: { type: String, default: '' },
  onRetryLoad: { type: Function, default: null },
})
</script>
