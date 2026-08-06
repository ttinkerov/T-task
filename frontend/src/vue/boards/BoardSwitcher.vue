<template>
  <div class="board-switcher">
    <select
      :value="boardId || ''"
      class="board-filters__select"
      aria-label="Доска"
      :disabled="isLoading || boards.length === 0"
      @change="onBoardChange?.($event.target.value)"
    >
      <option v-for="board in boards" :key="board.id" :value="board.id">
        {{ board.name }}
      </option>
    </select>

    <button type="button" class="board-filters__chip" @click="startCreate">Новая доска</button>

    <button v-if="selected" type="button" class="board-filters__chip" @click="startRename">
      Переименовать
    </button>

    <button
      v-if="boards.length > 1 && boardId"
      type="button"
      class="board-filters__reset"
      :disabled="deletePending"
      @click="onDelete?.()"
    >
      Удалить
    </button>

    <form v-if="creating" class="board-switcher__form" @submit.prevent="submitCreate">
      <input
        v-model="newName"
        placeholder="Название доски"
        maxlength="80"
        class="glass-input"
        autofocus
      />
      <select v-model="templateId" class="board-filters__select" aria-label="Шаблон доски">
        <option v-for="template in templateOptions" :key="template.id" :value="template.id">
          {{ template.name }}
        </option>
      </select>
      <button type="submit" class="btn-primary" :disabled="createPending">Создать</button>
      <button type="button" class="btn-ghost" @click="cancelCreate">Отмена</button>
    </form>

    <form v-if="renaming" class="board-switcher__form" @submit.prevent="submitRename">
      <input
        v-model="renameValue"
        placeholder="Название доски"
        maxlength="80"
        class="board-filters__search"
        aria-label="Новое название доски"
        autofocus
      />
      <button
        type="submit"
        class="board-filters__chip board-filters__chip--active"
        :disabled="!renameValue.trim() || updatePending"
      >
        Сохранить
      </button>
      <button type="button" class="board-filters__reset" @click="renaming = false">Отмена</button>
    </form>

    <p v-if="error" class="board-switcher__error" role="alert">{{ error }}</p>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  boards: { type: Array, default: () => [] },
  boardId: { type: String, default: '' },
  isLoading: { type: Boolean, default: false },
  templates: { type: Array, default: () => [] },
  createPending: { type: Boolean, default: false },
  updatePending: { type: Boolean, default: false },
  deletePending: { type: Boolean, default: false },
  error: { type: String, default: '' },
  onBoardChange: { type: Function, default: null },
  onCreate: { type: Function, default: null },
  onRename: { type: Function, default: null },
  onDelete: { type: Function, default: null },
  onRequestTemplates: { type: Function, default: null },
})

const creating = ref(false)
const renaming = ref(false)
const newName = ref('')
const renameValue = ref('')
const templateId = ref('kanban')

const selected = computed(() => props.boards.find((board) => board.id === props.boardId) || null)
const templateOptions = computed(() =>
  props.templates.length ? props.templates : [{ id: 'kanban', name: 'Канбан' }],
)

watch(creating, (open) => {
  if (open) props.onRequestTemplates?.()
})

function startCreate() {
  creating.value = true
  renaming.value = false
}

function cancelCreate() {
  creating.value = false
  newName.value = ''
}

function startRename() {
  if (!selected.value) return
  renaming.value = true
  creating.value = false
  renameValue.value = selected.value.name
}

async function submitCreate() {
  await props.onCreate?.(newName.value.trim() || 'Новая доска', templateId.value)
  creating.value = false
  newName.value = ''
  templateId.value = 'kanban'
}

async function submitRename() {
  if (!renameValue.value.trim()) return
  await props.onRename?.(renameValue.value.trim())
  renaming.value = false
}
</script>
