<template>
  <div class="forms-page">
    <header class="forms-page__header">
      <div>
        <h1 class="forms-page__title">Формы</h1>
        <p class="forms-page__subtitle">
          Создавайте опросы и собирайте ответы. Статистика по вариантам и автоматическое создание
          задач на доске.
        </p>
      </div>
    </header>

    <form class="forms-create" @submit.prevent="onSubmit">
      <input
        v-model="title"
        placeholder="Название новой формы"
        maxlength="120"
        class="glass-input"
      />
      <button type="submit" class="btn-primary" :disabled="!title.trim() || isCreating">
        Создать
      </button>
    </form>

    <p v-if="isLoading" class="text-sm text-muted-foreground">Загрузка форм...</p>

    <p v-else-if="forms.length === 0" class="forms-page__empty">
      Пока нет форм. Создайте первую опросную форму выше.
    </p>

    <ul v-else class="forms-list">
      <li v-for="form in forms" :key="form.id" class="forms-list__item">
        <div class="forms-list__main">
          <a :href="'/dashboard/forms/' + form.id" class="forms-list__title">{{ form.title }}</a>
          <p v-if="form.description" class="forms-list__desc">{{ form.description }}</p>
          <p class="forms-list__meta">
            {{ form.fieldCount }} полей · {{ form.responseCount }} ответов
          </p>
        </div>
        <div class="forms-list__actions">
          <a :href="'/f/' + form.publicToken" class="btn-ghost" target="_blank" rel="noreferrer">
            Открыть
          </a>
          <button
            type="button"
            class="btn-ghost forms-list__danger"
            :disabled="isDeleting"
            @click="onDeleteClick(form)"
          >
            Удалить
          </button>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  forms: { type: Array, required: true },
  isLoading: { type: Boolean, default: false },
  isCreating: { type: Boolean, default: false },
  isDeleting: { type: Boolean, default: false },
  onCreate: { type: Function, required: true },
  onDelete: { type: Function, required: true },
})

const title = ref('')

async function onSubmit() {
  const trimmed = title.value.trim()
  if (!trimmed) return

  try {
    await props.onCreate(trimmed)
    title.value = ''
  } catch {
    /* ignore */
  }
}

function onDeleteClick(form) {
  if (window.confirm('Удалить форму «' + form.title + '»?')) {
    props.onDelete(form.id)
  }
}
</script>
