<template>
  <section class="task-subtasks task-attachments" aria-labelledby="task-attachments-title">
    <div class="task-subtasks__header">
      <h3 id="task-attachments-title" class="task-drawer__section-title">
        Вложения
        <FieldHint text="Файлы к задаче: изображения, PDF или TXT до 5 МБ." />
      </h3>
      <span>{{ attachments.length }}</span>
    </div>

    <p v-if="isLoading" role="status">Загрузка вложений...</p>

    <p v-else-if="isError" class="text-sm text-red-400" role="alert">
      {{ loadError || 'Не удалось загрузить вложения' }}
      <button type="button" class="board-filters__chip" @click="onRetry?.()">Повторить</button>
    </p>

    <p v-else-if="attachments.length === 0" class="task-tags__empty">Пока нет файлов</p>

    <ul v-else class="task-attachments__list" role="list">
      <li v-for="attachment in attachments" :key="attachment.id">
        <button
          v-if="attachment.isImage && thumbnails[attachment.id]"
          type="button"
          class="task-attachments__thumb"
          :aria-label="'Открыть ' + attachment.originalName"
          @click="onOpen?.(attachment.id)"
        >
          <img :src="thumbnails[attachment.id]" alt="" />
        </button>
        <button
          v-else
          type="button"
          class="task-attachments__file"
          @click="onOpen?.(attachment.id)"
        >
          <span aria-hidden="true">
            {{ attachment.isImage ? 'IMG' : attachment.isPdf ? 'PDF' : 'TXT' }}
          </span>
          <span>{{ attachment.originalName }}</span>
        </button>
        <button
          type="button"
          :aria-label="'Удалить ' + attachment.originalName"
          :disabled="deletePending"
          @click="onDelete?.(attachment.id)"
        >
          ×
        </button>
      </li>
    </ul>

    <div class="task-subtasks__create">
      <input
        :id="inputId"
        ref="fileInput"
        type="file"
        :accept="accept"
        class="sr-only"
        @change="onFileChange"
      />
      <label :for="inputId" class="task-attachments__upload">
        {{ uploadPending ? 'Загрузка…' : 'Загрузить файл' }}
      </label>
    </div>

    <p v-if="error" class="text-sm text-red-400" role="alert">{{ error }}</p>
    <p class="task-attachments__hint">Изображения, PDF или TXT до 5 МБ</p>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import FieldHint from './FieldHint.vue'

const props = defineProps({
  taskId: { type: String, required: true },
  attachments: { type: Array, default: () => [] },
  thumbnails: { type: Object, default: () => ({}) },
  accept: { type: String, required: true },
  isLoading: { type: Boolean, default: false },
  isError: { type: Boolean, default: false },
  loadError: { type: String, default: '' },
  uploadPending: { type: Boolean, default: false },
  deletePending: { type: Boolean, default: false },
  error: { type: String, default: '' },
  onOpen: { type: Function, default: null },
  onDelete: { type: Function, default: null },
  onUpload: { type: Function, default: null },
  onRetry: { type: Function, default: null },
})

const fileInput = ref(null)
const inputId = computed(() => 'task-attachment-upload-' + props.taskId)

function onFileChange(event) {
  const files = event.target.files
  props.onUpload?.(files)
  if (fileInput.value) fileInput.value.value = ''
}
</script>
