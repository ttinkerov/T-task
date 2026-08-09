<template>
  <section class="task-tags" aria-labelledby="task-tags-title">
    <h3 id="task-tags-title" class="task-drawer__section-title">
      Теги
      <FieldHint text="Метки для группировки и фильтрации задач на доске." />
    </h3>

    <p v-if="loadError" class="task-tags__empty" role="alert">
      {{ loadError }}
      <button type="button" class="board-filters__chip" @click="onRetry?.()">Повторить</button>
    </p>

    <p v-else-if="tags.length === 0" class="task-tags__empty">
      Тегов пока нет. Создайте их в разделе «Теги».
    </p>

    <div v-else class="task-tags__list">
      <button
        v-for="tag in tags"
        :key="tag.id"
        type="button"
        class="tag-chip"
        :class="{ 'tag-chip--active': selectedIds.includes(tag.id) }"
        :style="{
          background: selectedIds.includes(tag.id) ? tag.color + '33' : 'transparent',
          color: tag.color,
          borderColor: tag.color,
        }"
        :aria-pressed="selectedIds.includes(tag.id)"
        :disabled="isPending"
        @click="onToggle?.(tag.id)"
      >
        <i :style="{ background: tag.color }" />
        {{ tag.name }}
      </button>
    </div>

    <p v-if="actionError" class="task-tags__empty" role="alert">{{ actionError }}</p>
  </section>
</template>

<script setup>
import FieldHint from './FieldHint.vue'

defineProps({
  tags: { type: Array, default: () => [] },
  selectedIds: { type: Array, default: () => [] },
  isPending: { type: Boolean, default: false },
  loadError: { type: String, default: '' },
  actionError: { type: String, default: '' },
  onToggle: { type: Function, default: null },
  onRetry: { type: Function, default: null },
})
</script>
