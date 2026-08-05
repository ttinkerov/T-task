<template>
  <div>
    <header class="all-tasks__header">
      <div>
        <p class="all-tasks__eyebrow">Личное</p>
        <h1 id="my-tasks-title">Мои задачи</h1>
        <p>
          Как Notion «Assigned to me»: просроченные, ближайшие {{ dueSoonDays }} дней, назначенные
          вам и те, за которыми вы следите.
        </p>
      </div>
      <strong>{{ totalVisible }} открытых</strong>
    </header>

    <p v-if="isLoading" role="status">Загрузка задач...</p>
    <p v-if="isError" class="all-tasks__error">Не удалось загрузить задачи.</p>

    <p v-if="!isLoading && !isError && totalVisible === 0" class="my-tasks__empty">
      Пока пусто — назначьте себе задачу или включите «Следить» в карточке.
    </p>

    <MyTasksSection
      v-for="section in sections"
      :key="section.id"
      :id="section.id"
      :title="section.title"
      :hint="section.hint"
      :tasks="section.tasks"
      :tone="section.tone || ''"
      :priority-labels="priorityLabels"
      :on-open-task="onOpenTask"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import MyTasksSection from './MyTasksSection.vue'

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
  onOpenTask: { type: Function, required: true },
})

const sections = computed(() => [
  {
    id: 'overdue',
    title: 'Просроченные',
    hint: 'Дедлайн уже прошёл',
    tasks: props.overdue,
    tone: 'danger',
  },
  {
    id: 'dueSoon',
    title: 'Скоро дедлайн',
    hint: 'В ближайшие ' + props.dueSoonDays + ' дней',
    tasks: props.dueSoon,
    tone: 'warn',
  },
  {
    id: 'assigned',
    title: 'Назначены мне',
    hint: 'Без срочного дедлайна',
    tasks: props.assigned,
  },
  {
    id: 'watching',
    title: 'Слежу',
    hint: 'Вы подписаны, но не исполнитель',
    tasks: props.watching,
  },
])
</script>
