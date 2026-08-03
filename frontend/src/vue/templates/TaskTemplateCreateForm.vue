<template>
  <section class="dod-page__form-block">
    <div class="templates-page__section-head">
      <h2>Новый шаблон задачи</h2>
      <button
        v-if="showSeed"
        type="button"
        class="btn-ghost"
        :disabled="isSeeding"
        @click="onSeedClick"
      >
        {{ isSeeding ? 'Добавляем…' : 'Добавить «Bug»' }}
      </button>
    </div>

    <form class="dod-page__form templates-page__form" @submit.prevent="onSubmit">
      <input
        v-model="name"
        class="glass-input"
        placeholder="Название шаблона (Bug)"
        maxlength="120"
        required
      />
      <input
        v-model="title"
        class="glass-input"
        placeholder="Заголовок по умолчанию (необязательно)"
        maxlength="200"
      />
      <textarea v-model="description" class="glass-input" placeholder="Описание" rows="4" />
      <select v-model="priority" class="glass-input" aria-label="Приоритет">
        <option
          v-for="option in priorityOptions"
          :key="option.value || 'none'"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>

      <fieldset v-if="tags.length > 0" class="templates-page__tags">
        <legend>Теги</legend>
        <label v-for="tag in tags" :key="tag.id">
          <input
            type="checkbox"
            :checked="tagIds.includes(tag.id)"
            @change="toggleTag(tag.id)"
          />
          <span :style="{ color: tag.color }">{{ tag.name }}</span>
        </label>
      </fieldset>

      <textarea
        v-model="subtasksText"
        class="glass-input"
        placeholder="Подзадачи — по одной в строке&#10;Написать тест&#10;Исправить"
        rows="3"
      />
      <textarea
        v-model="checklistText"
        class="glass-input"
        placeholder="Чеклист — по одному в строке&#10;Reproduce&#10;Fix&#10;Review"
        rows="3"
      />
      <label class="dod-page__toggle">
        <input v-model="checklistGates" type="checkbox" />
        Чеклист блокирует завершение
      </label>

      <button type="submit" class="btn-primary" :disabled="isCreating || !name.trim()">
        {{ isCreating ? 'Создаём…' : 'Создать шаблон' }}
      </button>
    </form>

    <p v-if="errorMessage" class="dod-page__error" role="alert">
      {{ errorMessage }}
    </p>
  </section>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  tags: { type: Array, default: () => [] },
  priorityOptions: { type: Array, required: true },
  showSeed: { type: Boolean, default: false },
  isCreating: { type: Boolean, default: false },
  isSeeding: { type: Boolean, default: false },
  errorMessage: { type: String, default: '' },
  onCreate: { type: Function, required: true },
  onSeed: { type: Function, required: true },
})

const name = ref('')
const title = ref('')
const description = ref('')
const priority = ref('')
const tagIds = ref([])
const subtasksText = ref('')
const checklistText = ref('')
const checklistGates = ref(true)

function splitLines(value) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function toggleTag(tagId) {
  if (tagIds.value.includes(tagId)) {
    tagIds.value = tagIds.value.filter((id) => id !== tagId)
  } else {
    tagIds.value = [...tagIds.value, tagId]
  }
}

async function onSeedClick() {
  try {
    await props.onSeed()
  } catch {
    /* errorMessage from React */
  }
}

async function onSubmit() {
  const trimmed = name.value.trim()
  if (!trimmed) return

  try {
    await props.onCreate({
      name: trimmed,
      title: title.value.trim() || undefined,
      description: description.value.trim() || undefined,
      priority: priority.value || undefined,
      tagIds: [...tagIds.value],
      subtaskTitles: splitLines(subtasksText.value),
      checklistItems: splitLines(checklistText.value),
      checklistGates: checklistGates.value,
    })
    name.value = ''
    title.value = ''
    description.value = ''
    priority.value = ''
    tagIds.value = []
    subtasksText.value = ''
    checklistText.value = ''
    checklistGates.value = true
  } catch {
    /* errorMessage from React */
  }
}
</script>
