<template>
  <section class="onboarding" aria-labelledby="onboarding-title">
    <header class="onboarding__header">
      <p class="onboarding__eyebrow">Старт за 30 секунд · шаг {{ stepIndex }} из 3</p>
      <h1 id="onboarding-title" class="onboarding__title">{{ title }}</h1>
      <p class="onboarding__lead">{{ lead }}</p>
    </header>

    <ol class="onboarding__steps" aria-hidden="true">
      <li :class="{ 'is-active': stepIndex >= 1 }">Команда</li>
      <li :class="{ 'is-active': stepIndex >= 2 }">Доска</li>
      <li :class="{ 'is-active': stepIndex >= 3 }">Задача</li>
    </ol>

    <form v-if="step === 'workspace'" class="onboarding__panel" @submit.prevent="onWorkspaceNext?.()">
      <label class="onboarding__label" for="workspace-name">Название команды</label>
      <input
        id="workspace-name"
        :value="name"
        placeholder="Например, Acme Team"
        minlength="2"
        maxlength="80"
        class="glass-input"
        autofocus
        required
        @input="onNameChange?.($event.target.value)"
      />
      <button type="submit" class="btn-primary w-full" :disabled="name.trim().length < 2">
        Далее — к доске
      </button>
    </form>

    <div v-else-if="step === 'board'" class="onboarding__panel">
      <div class="onboarding__board-preview" aria-label="Превью доски">
        <div v-for="column in boardColumns" :key="column" class="onboarding__column">
          <strong>{{ column }}</strong>
          <span />
          <span />
        </div>
      </div>
      <p class="onboarding__hint">
        Для «{{ name.trim() }}» создадим доску с колонками Бэклог → В работе → Готово.
      </p>
      <div class="onboarding__actions">
        <button type="button" class="btn-ghost flex-1" @click="onBack?.()">Назад</button>
        <button type="button" class="btn-primary flex-1" @click="onBoardNext?.()">
          Далее — к задаче
        </button>
      </div>
    </div>

    <form v-else class="onboarding__panel" @submit.prevent="onFinishWithTask?.()">
      <label class="onboarding__label" for="first-task">Название первой задачи</label>
      <input
        id="first-task"
        :value="taskTitle"
        placeholder="Например, Настроить доску под команду"
        maxlength="200"
        class="glass-input"
        autofocus
        required
        @input="onTaskTitleChange?.($event.target.value)"
      />
      <div class="onboarding__actions">
        <button type="button" class="btn-ghost flex-1" :disabled="isFinishing" @click="onBack?.()">
          Назад
        </button>
        <button
          type="submit"
          class="btn-primary flex-1"
          :disabled="taskTitle.trim().length < 2 || isFinishing"
        >
          {{ isFinishing ? 'Создание…' : 'Создать и открыть доску' }}
        </button>
      </div>
      <button
        type="button"
        class="onboarding__skip"
        :disabled="isFinishing"
        @click="onSkipTask?.()"
      >
        Пропустить задачу и открыть пустую доску
      </button>
    </form>

    <p v-if="error" class="onboarding__error" role="alert">{{ error }}</p>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  step: { type: String, default: 'workspace' },
  name: { type: String, default: '' },
  taskTitle: { type: String, default: '' },
  error: { type: String, default: '' },
  isFinishing: { type: Boolean, default: false },
  boardColumns: { type: Array, default: () => ['Бэклог', 'В работе', 'Готово'] },
  onNameChange: { type: Function, default: null },
  onWorkspaceNext: { type: Function, default: null },
  onBoardNext: { type: Function, default: null },
  onBack: { type: Function, default: null },
  onTaskTitleChange: { type: Function, default: null },
  onFinishWithTask: { type: Function, default: null },
  onSkipTask: { type: Function, default: null },
})

const stepIndex = computed(() => {
  if (props.step === 'board') return 2
  if (props.step === 'task') return 3
  return 1
})

const title = computed(() => {
  if (props.step === 'board') return 'Доска уже готова'
  if (props.step === 'task') return 'Добавьте первую задачу'
  return 'Создайте команду'
})

const lead = computed(() => {
  if (props.step === 'board') {
    return 'Мы сразу подготовим канбан с тремя колонками. Останется только задача.'
  }
  if (props.step === 'task') {
    return 'Одна задача — и вы уже в рабочем потоке. Потом можно править на доске.'
  }
  return 'Команда — это пространство, где живут доски, задачи и CRM.'
})
</script>
