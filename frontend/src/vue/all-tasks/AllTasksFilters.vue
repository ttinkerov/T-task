<template>
  <fieldset class="all-tasks__filters">
    <legend class="sr-only">Фильтры и сортировка задач</legend>

    <div ref="savedHostEl" class="all-tasks__saved-filters-host" v-once />

    <button type="button" class="board-filters__chip" @click="onExport?.()">
      CSV
    </button>
    <p v-if="exportError" class="text-sm text-red-400" role="alert">{{ exportError }}</p>

    <input
      :value="searchInput"
      placeholder="Поиск по названию..."
      aria-label="Поиск задач"
      @input="onSearchChange?.($event.target.value)"
    />

    <select
      :value="filters.boardId"
      aria-label="Фильтр по доске"
      @change="patchFilters({ boardId: $event.target.value, columnId: '' })"
    >
      <option value="">Все доски</option>
      <option v-for="board in boards" :key="board.id" :value="board.id">
        {{ board.name }}
      </option>
    </select>

    <select
      :value="filters.columnId"
      :disabled="!filters.boardId"
      aria-label="Фильтр по колонке"
      @change="patchFilters({ columnId: $event.target.value })"
    >
      <option value="">Все колонки</option>
      <option v-for="column in columns" :key="column.id" :value="column.id">
        {{ column.name }}
      </option>
    </select>

    <select
      :value="filters.assigneeId"
      :disabled="assigneeLocked"
      aria-label="Фильтр по исполнителю"
      @change="patchFilters({ assigneeId: $event.target.value })"
    >
      <option value="">{{ assigneeLocked ? 'Только я' : 'Все исполнители' }}</option>
      <option v-for="member in members" :key="member.userId" :value="member.userId">
        {{ member.user.name }}
      </option>
    </select>
    <p v-if="membersLoadError" class="text-sm text-red-400" role="alert">
      {{ membersLoadError }}
      <button type="button" class="board-filters__chip" @click="onRetryMembers?.()">Повторить</button>
    </p>

    <select
      :value="filters.tagId"
      aria-label="Фильтр по тегу"
      @change="patchFilters({ tagId: $event.target.value })"
    >
      <option value="">Все теги</option>
      <option v-for="tag in tags" :key="tag.id" :value="tag.id">
        {{ tag.name }}
      </option>
    </select>

    <select
      :value="filters.priority"
      aria-label="Фильтр по приоритету"
      @change="patchFilters({ priority: $event.target.value })"
    >
      <option value="">Все приоритеты</option>
      <option
        v-for="option in priorityOptions"
        :key="option.value"
        :value="option.value"
      >
        {{ option.label }}
      </option>
    </select>

    <select
      :value="filters.status"
      aria-label="Фильтр по статусу"
      @change="patchFilters({ status: $event.target.value })"
    >
      <option value="">Все статусы</option>
      <option value="OPEN">Открытые</option>
      <option value="COMPLETED">Завершённые</option>
    </select>

    <select
      :value="filters.due"
      aria-label="Фильтр по сроку"
      @change="patchFilters({ due: $event.target.value })"
    >
      <option value="">Любой срок</option>
      <option value="OVERDUE">Просроченные</option>
      <option value="DUE_SOON">Скоро (7 дней)</option>
      <option value="UPCOMING">Предстоящие</option>
      <option value="NO_DUE">Без срока</option>
    </select>

    <select
      :value="sortValue"
      aria-label="Сортировка задач"
      @change="onSortChange?.($event.target.value)"
    >
      <option value="CREATED_AT:DESC">Сначала новые</option>
      <option value="UPDATED_AT:DESC">Недавно изменённые</option>
      <option value="DUE_DATE:ASC">Ближайший срок</option>
      <option value="PRIORITY:DESC">По приоритету</option>
      <option value="TITLE:ASC">По названию</option>
    </select>

    <button type="button" @click="onReset?.()">Сбросить</button>
  </fieldset>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  searchInput: { type: String, default: '' },
  filters: { type: Object, required: true },
  sortValue: { type: String, required: true },
  boards: { type: Array, default: () => [] },
  columns: { type: Array, default: () => [] },
  members: { type: Array, default: () => [] },
  tags: { type: Array, default: () => [] },
  priorityOptions: { type: Array, default: () => [] },
  assigneeLocked: { type: Boolean, default: false },
  exportError: { type: String, default: '' },
  membersLoadError: { type: String, default: '' },
  onSearchChange: { type: Function, default: null },
  onFiltersChange: { type: Function, default: null },
  onSortChange: { type: Function, default: null },
  onReset: { type: Function, default: null },
  onExport: { type: Function, default: null },
  onSavedHostReady: { type: Function, default: null },
  onRetryMembers: { type: Function, default: null },
})

const savedHostEl = ref(null)

function patchFilters(patch) {
  props.onFiltersChange?.({ ...props.filters, ...patch })
}

function notifySavedHost(el) {
  props.onSavedHostReady?.(el)
}

onMounted(() => {
  notifySavedHost(savedHostEl.value)
})

watch(savedHostEl, (el) => {
  notifySavedHost(el)
})

onBeforeUnmount(() => {
  notifySavedHost(null)
})
</script>
