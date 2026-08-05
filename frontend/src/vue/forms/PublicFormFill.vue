<template>
  <main class="public-form">
    <p v-if="isLoading">Загрузка формы...</p>

    <p v-else-if="isError || !form">Форма не найдена или недоступна.</p>

    <div v-else-if="submitted" class="public-form__card">
      <h1>Спасибо!</h1>
      <p>Ответ отправлен.</p>
    </div>

    <form v-else class="public-form__card" @submit.prevent="onSubmit">
      <h1 class="public-form__title">{{ form.title }}</h1>
      <p v-if="form.description" class="public-form__desc">{{ form.description }}</p>

      <div class="public-form__fields">
        <template v-for="field in form.fields" :key="field.id">
          <label v-if="field.type === 'LONG_TEXT'" class="task-drawer__field">
            <span>{{ field.label }}{{ field.required ? ' *' : '' }}</span>
            <textarea
              class="glass-input task-drawer__textarea"
              rows="4"
              :required="field.required"
              :value="stringValue(field.id)"
              @input="setAnswer(field.id, $event.target.value)"
            />
          </label>

          <fieldset v-else-if="field.type === 'SINGLE_CHOICE'" class="public-form__choice">
            <legend>{{ field.label }}{{ field.required ? ' *' : '' }}</legend>
            <label
              v-for="option in field.options"
              :key="option"
              class="public-form__choice-item"
            >
              <input
                type="radio"
                :name="field.id"
                :value="option"
                :checked="answers[field.id] === option"
                :required="field.required"
                @change="setAnswer(field.id, option)"
              />
              {{ option }}
            </label>
          </fieldset>

          <fieldset v-else-if="field.type === 'MULTIPLE_CHOICE'" class="public-form__choice">
            <legend>{{ field.label }}{{ field.required ? ' *' : '' }}</legend>
            <label
              v-for="option in field.options"
              :key="option"
              class="public-form__choice-item"
            >
              <input
                type="checkbox"
                :checked="arrayValue(field.id).includes(option)"
                @change="toggleOption(field.id, option, $event.target.checked)"
              />
              {{ option }}
            </label>
          </fieldset>

          <label v-else class="task-drawer__field">
            <span>{{ field.label }}{{ field.required ? ' *' : '' }}</span>
            <input
              class="glass-input"
              :required="field.required"
              :value="stringValue(field.id)"
              @input="setAnswer(field.id, $event.target.value)"
            />
          </label>
        </template>
      </div>

      <p v-if="errorMessage" class="text-sm text-red-400">{{ errorMessage }}</p>

      <button
        type="submit"
        class="btn-primary public-form__submit"
        :disabled="isPending || form.fields.length === 0"
      >
        {{ isPending ? 'Отправка...' : 'Отправить' }}
      </button>
    </form>
  </main>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  form: { type: Object, default: null },
  isLoading: { type: Boolean, default: false },
  isError: { type: Boolean, default: false },
  isPending: { type: Boolean, default: false },
  errorMessage: { type: String, default: '' },
  onSubmit: { type: Function, required: true },
})

const answers = ref({})
const submitted = ref(false)

function stringValue(fieldId) {
  const value = answers.value[fieldId]
  return typeof value === 'string' ? value : ''
}

function arrayValue(fieldId) {
  const value = answers.value[fieldId]
  return Array.isArray(value) ? value : []
}

function setAnswer(fieldId, value) {
  answers.value = { ...answers.value, [fieldId]: value }
}

function toggleOption(fieldId, option, checked) {
  const selected = arrayValue(fieldId)
  const next = checked
    ? [...selected, option]
    : selected.filter((item) => item !== option)
  setAnswer(fieldId, next)
}

async function onSubmit() {
  try {
    await props.onSubmit({ ...answers.value })
    submitted.value = true
  } catch {
    /* errorMessage from React */
  }
}
</script>
