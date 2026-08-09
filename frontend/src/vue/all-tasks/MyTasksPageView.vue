<template>
  <div>
    <header class="all-tasks__header">
      <div>
        <p class="all-tasks__eyebrow">Личное</p>
        <h1 id="my-tasks-title">Мои задачи</h1>
        <p>
          Просроченные, ближайшие {{ dueSoonDays }} дней, назначенные вам и те, за которыми вы
          следите.
        </p>
      </div>
      <strong>{{ totalVisible }} открытых</strong>
    </header>

    <MyTasksTabs :tabs="tabItems" :active-id="activeSection" :on-change="setActiveSection" />

    <p v-if="isLoading" role="status">Загрузка задач...</p>
    <p v-if="isError" class="all-tasks__error" role="alert">
      Не удалось загрузить задачи.
      <button type="button" class="board-filters__chip" @click="onRetry?.()">Повторить</button>
    </p>

    <p v-if="!isLoading && !isError && totalVisible === 0" class="my-tasks__empty">
      Пока пусто — назначьте себе задачу или включите «Следить» в карточке.
    </p>

    <MyTasksSection
      v-for="section in visibleSections"
      :key="section.id"
      :id="section.id"
      :title="section.title"
      :hint="section.hint"
      :tasks="section.tasks"
      :tone="section.tone || ''"
      :empty-label="section.emptyLabel || ''"
      :priority-labels="priorityLabels"
      :on-open-task="onOpenTask"
    />
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import MyTasksSection from './MyTasksSection.vue'
import MyTasksTabs from './MyTasksTabs.vue'

const props = defineProps({
  dueSoonDays: { type: Number, required: true },
  totalVisible: { type: Number, required: true },
  isLoading: { type: Boolean, default: false },
  isError: { type: Boolean, default: false },
  overdue: { type: Array, required: true },
  dueSoon: { type: Array, required: true },
  assigned: { type: Array, required: true },
  watching: { type: Array, required: true },
  priorityLabels: { type: Object, required: true },
  initialSection: { type: String, default: 'all' },
  onOpenTask: { type: Function, required: true },
  onRetry: { type: Function, default: null },
})

const SECTION_IDS = ['all', 'overdue', 'dueSoon', 'assigned', 'watching']

function normalizeSection(value) {
  return SECTION_IDS.includes(value) ? value : 'all'
}

const activeSection = ref(normalizeSection(props.initialSection))

watch(
  () => props.initialSection,
  (next) => {
    activeSection.value = normalizeSection(next)
  },
)

function setActiveSection(id) {
  activeSection.value = normalizeSection(id)
}

const allSections = computed(() => [
  {
    id: 'overdue',
    title: 'Просроченные',
    hint: 'Дедлайн уже прошёл',
    tasks: props.overdue,
    tone: 'danger',
    emptyLabel: 'Просроченных задач нет.',
  },
  {
    id: 'dueSoon',
    title: 'Скоро дедлайн',
    hint: 'В ближайшие ' + props.dueSoonDays + ' дней',
    tasks: props.dueSoon,
    tone: 'warn',
    emptyLabel: 'В ближайшие дни дедлайнов нет.',
  },
  {
    id: 'assigned',
    title: 'Назначены мне',
    hint: 'Без срочного дедлайна',
    tasks: props.assigned,
    emptyLabel: 'Нет назначенных задач без срочного срока.',
  },
  {
    id: 'watching',
    title: 'Слежу',
    hint: 'Вы подписаны, но не исполнитель',
    tasks: props.watching,
    emptyLabel: 'Вы ни за чем не следите.',
  },
])

const tabItems = computed(() => [
  { id: 'all', label: 'Все', count: props.totalVisible },
  ...allSections.value.map((section) => ({
    id: section.id,
    label: section.title,
    count: section.tasks.length,
  })),
])

const visibleSections = computed(() => {
  if (activeSection.value === 'all') {
    return allSections.value
      .filter((section) => section.tasks.length > 0)
      .map((section) => ({ ...section, emptyLabel: '' }))
  }

  return allSections.value.filter((section) => section.id === activeSection.value)
})
</script>
