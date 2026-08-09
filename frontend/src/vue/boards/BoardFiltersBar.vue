<template>
  <p v-if="loadError" class="text-sm text-red-400" role="alert">
    {{ loadError }}
    <button type="button" class="board-filters__chip" @click="onRetry?.()">Повторить</button>
  </p>

  <input
    :value="filters.search"
    placeholder="Поиск задач..."
    class="board-filters__search"
    @input="onSearchInput"
  />

  <select
    :value="filters.priority"
    class="board-filters__select"
    aria-label="Фильтр по приоритету"
    @change="onSelectChange('priority', $event)"
  >
    <option value="">Все приоритеты</option>
    <option v-for="option in priorityOptions" :key="option.value" :value="option.value">
      {{ option.label }}
    </option>
  </select>

  <select
    :value="filters.assigneeId"
    class="board-filters__select"
    aria-label="Фильтр по исполнителю"
    @change="onSelectChange('assigneeId', $event)"
  >
    <option value="">Все исполнители</option>
    <option v-for="member in members" :key="member.userId" :value="member.userId">
      {{ member.name }}
    </option>
  </select>

  <select
    :value="filters.tagId"
    class="board-filters__select"
    aria-label="Фильтр по тегу"
    @change="onSelectChange('tagId', $event)"
  >
    <option value="">Все теги</option>
    <option v-for="tag in tags" :key="tag.id" :value="tag.id">{{ tag.name }}</option>
  </select>

  <select
    :value="filters.sprintId"
    class="board-filters__select"
    aria-label="Фильтр по спринту"
    @change="onSelectChange('sprintId', $event)"
  >
    <option value="">Все спринты</option>
    <option v-for="sprint in sprints" :key="sprint.id" :value="sprint.id">
      {{ sprint.name }}{{ sprint.active ? ' · активный' : '' }}
    </option>
  </select>

  <select
    :value="filters.epicId"
    class="board-filters__select"
    aria-label="Фильтр по эпику"
    @change="onSelectChange('epicId', $event)"
  >
    <option value="">Все эпики</option>
    <option v-for="epic in epics" :key="epic.id" :value="epic.id">{{ epic.title }}</option>
  </select>

  <select
    :value="filters.overdueStatus"
    class="board-filters__select"
    aria-label="Фильтр по просрочке"
    @change="onSelectChange('overdueStatus', $event)"
  >
    <option v-for="option in overdueOptions" :key="option.label" :value="option.value">
      {{ option.label }}
    </option>
  </select>

  <button
    type="button"
    class="board-filters__chip"
    :class="{ 'board-filters__chip--active': filters.myTasksOnly }"
    @click="patch({ myTasksOnly: !filters.myTasksOnly })"
  >
    Мои задачи
  </button>

  <button
    v-if="activeSprint"
    type="button"
    class="board-filters__chip"
    :class="{ 'board-filters__chip--active': filters.sprintId === activeSprint.id }"
    @click="
      patch({
        sprintId: filters.sprintId === activeSprint.id ? '' : activeSprint.id,
      })
    "
  >
    Этот спринт
  </button>

  <button v-if="hasActiveFilters" type="button" class="board-filters__reset" @click="onReset?.()">
    Сбросить
  </button>
</template>

<script setup>
const props = defineProps({
  filters: { type: Object, required: true },
  members: { type: Array, default: () => [] },
  tags: { type: Array, default: () => [] },
  sprints: { type: Array, default: () => [] },
  epics: { type: Array, default: () => [] },
  activeSprint: { type: Object, default: null },
  priorityOptions: { type: Array, default: () => [] },
  overdueOptions: { type: Array, default: () => [] },
  hasActiveFilters: { type: Boolean, default: false },
  loadError: { type: String, default: '' },
  onChange: { type: Function, default: null },
  onReset: { type: Function, default: null },
  onRetry: { type: Function, default: null },
})

function eventValue(event) {
  const target = event?.target
  return target && 'value' in target ? target.value : ''
}

function patch(partial) {
  props.onChange?.({ ...props.filters, ...partial })
}

function onSearchInput(event) {
  patch({ search: eventValue(event) })
}

function onSelectChange(key, event) {
  patch({ [key]: eventValue(event) })
}
</script>
