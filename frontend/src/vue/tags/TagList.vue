<template>
  <div>
    <form class="tags-page__create" @submit.prevent="onSubmit">
      <input
        v-model="name"
        placeholder="Название тега"
        maxlength="40"
        aria-label="Название тега"
      />

      <div class="tags-page__colors" role="group" aria-label="Цвет тега">
        <button
          v-for="option in colorOptions"
          :key="option"
          type="button"
          :class="{ 'is-active': color === option }"
          :style="{ background: option }"
          :aria-label="'Цвет ' + option"
          :aria-pressed="color === option"
          @click="color = option"
        />
      </div>

      <button type="submit" :disabled="isCreating || !name.trim()">Добавить</button>
    </form>

    <p v-if="isLoading" role="status">Загрузка тегов...</p>

    <ul v-else class="tags-page__list" role="list">
      <li v-for="tag in tags" :key="tag.id">
        <TagChip :name="tag.name" :color="tag.color" />

        <div class="tags-page__actions">
          <button type="button" @click="onRenameClick(tag)">Переименовать</button>
          <button type="button" @click="onDeleteClick(tag)">Удалить</button>
        </div>
      </li>
    </ul>

    <p v-if="!isLoading && tags.length === 0" class="tags-page__empty">
      Пока нет тегов — создайте первый выше.
    </p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import TagChip from './TagChip.vue'

const props = defineProps({
  tags: { type: Array, required: true },
  isLoading: { type: Boolean, default: false },
  isCreating: { type: Boolean, default: false },
  colorOptions: { type: Array, required: true },
})

const emit = defineEmits(['rename', 'delete', 'create'])

const name = ref('')
const color = ref(props.colorOptions[4] || props.colorOptions[0])

function onSubmit() {
  const trimmed = name.value.trim()
  if (!trimmed) return

  emit('create', { name: trimmed, color: color.value })
  name.value = ''
}

function onRenameClick(tag) {
  const next = window.prompt('Новое название', tag.name)
  if (next && next.trim() && next.trim() !== tag.name) {
    emit('rename', { tagId: tag.id, name: next.trim() })
  }
}

function onDeleteClick(tag) {
  if (window.confirm('Удалить тег «' + tag.name + '»?')) {
    emit('delete', tag.id)
  }
}
</script>
