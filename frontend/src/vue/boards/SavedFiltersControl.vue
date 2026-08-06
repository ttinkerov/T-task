<template>
  <div class="saved-filters">
    <select
      :value="selectedId"
      class="board-filters__select"
      aria-label="Сохранённые фильтры"
      :disabled="isLoading"
      @change="onSelect?.($event.target.value)"
    >
      <option value="">Сохранённые фильтры</option>
      <option v-for="item in saved" :key="item.id" :value="item.id">
        {{ item.isPinned ? '📌 ' : '' }}{{ item.isDefault ? '★ ' : '' }}{{ item.name
        }}{{ item.isShared ? ' · общий' : '' }}
      </option>
    </select>

    <button type="button" class="board-filters__chip" @click="saveOpen = !saveOpen">
      Сохранить фильтр
    </button>

    <template v-if="selected">
      <button
        v-if="!selected.isDefault"
        type="button"
        class="board-filters__chip"
        :disabled="updatePending"
        @click="onSetDefault?.(selected.id)"
      >
        По умолчанию
      </button>
      <button
        type="button"
        class="board-filters__chip"
        :disabled="updatePending"
        @click="onTogglePinned?.(selected.id, !selected.isPinned)"
      >
        {{ selected.isPinned ? 'Открепить' : 'Закрепить' }}
      </button>
      <button
        type="button"
        class="board-filters__chip"
        :disabled="updatePending"
        @click="onToggleShared?.(selected.id, !selected.isShared)"
      >
        {{ selected.isShared ? 'Скрыть' : 'Поделиться' }}
      </button>
      <button
        type="button"
        class="board-filters__reset"
        :disabled="deletePending"
        :aria-label="'Удалить фильтр ' + selected.name"
        @click="onDelete?.(selected.id)"
      >
        Удалить
      </button>
    </template>

    <form v-if="saveOpen" class="saved-filters__form" @submit.prevent="submitSave">
      <input
        v-model="saveName"
        placeholder="Название фильтра"
        maxlength="80"
        class="board-filters__search"
        aria-label="Название сохранённого фильтра"
        autofocus
      />
      <label class="saved-filters__default">
        <input v-model="saveAsDefault" type="checkbox" />
        По умолчанию
      </label>
      <label class="saved-filters__default">
        <input v-model="saveAsShared" type="checkbox" />
        Общий для команды
      </label>
      <button
        type="submit"
        class="board-filters__chip board-filters__chip--active"
        :disabled="!saveName.trim() || createPending"
      >
        {{ createPending ? 'Сохранение…' : 'Сохранить' }}
      </button>
      <button type="button" class="board-filters__reset" @click="saveOpen = false">Отмена</button>
    </form>

    <p v-if="error" class="saved-filters__error" role="alert">{{ error }}</p>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  saved: { type: Array, default: () => [] },
  selectedId: { type: String, default: '' },
  isLoading: { type: Boolean, default: false },
  createPending: { type: Boolean, default: false },
  updatePending: { type: Boolean, default: false },
  deletePending: { type: Boolean, default: false },
  error: { type: String, default: '' },
  onSelect: { type: Function, default: null },
  onSave: { type: Function, default: null },
  onSetDefault: { type: Function, default: null },
  onTogglePinned: { type: Function, default: null },
  onToggleShared: { type: Function, default: null },
  onDelete: { type: Function, default: null },
})

const saveOpen = ref(false)
const saveName = ref('')
const saveAsDefault = ref(false)
const saveAsShared = ref(false)

const selected = computed(() => props.saved.find((item) => item.id === props.selectedId) || null)

async function submitSave() {
  const name = saveName.value.trim()
  if (!name) return
  await props.onSave?.({
    name,
    isDefault: saveAsDefault.value,
    isShared: saveAsShared.value,
  })
  saveOpen.value = false
  saveName.value = ''
  saveAsDefault.value = false
  saveAsShared.value = false
}
</script>
