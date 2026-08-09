<template>
  <section
    class="custom-fields-page__form-block"
    aria-labelledby="custom-fields-form-title"
  >
    <h2 id="custom-fields-form-title">Новое поле</h2>

    <form class="custom-fields-page__form" @submit.prevent="onSubmit">
      <label class="custom-fields-page__field">
        <span>Название</span>
        <input
          v-model="name"
          class="glass-input"
          maxlength="80"
          placeholder="Например, Бюджет"
          required
        />
      </label>

      <label class="custom-fields-page__field">
        <span>Тип</span>
        <select v-model="type" class="glass-input">
          <option
            v-for="option in typeOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </label>

      <label v-if="needsOptions" class="custom-fields-page__field">
        <span>Варианты (по одному на строку)</span>
        <textarea
          v-model="optionsText"
          class="glass-input custom-fields-page__textarea"
          rows="4"
          placeholder="Низкий&#10;Средний&#10;Высокий"
        />
      </label>

      <label class="custom-fields-page__checkbox">
        <input v-model="showOnCard" type="checkbox" />
        <span>Показывать значение на карточке задачи</span>
      </label>

      <p v-if="errorMessage" class="custom-fields-page__error" role="alert">
        {{ errorMessage }}
      </p>

      <button
        type="submit"
        class="btn-primary"
        :disabled="isCreating || !name.trim() || (needsOptions && parsedOptions.length < 2)"
      >
        {{ isCreating ? 'Создание…' : 'Создать поле' }}
      </button>

      <p
        v-if="needsOptions && parsedOptions.length < 2"
        class="text-sm text-muted-foreground"
      >
        Для поля выбора нужно минимум 2 варианта.
      </p>
    </form>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  typeOptions: { type: Array, required: true },
  choiceTypes: { type: Array, required: true },
  isCreating: { type: Boolean, default: false },
  errorMessage: { type: String, default: '' },
  onCreate: { type: Function, required: true },
})

const name = ref('')
const type = ref('TEXT')
const optionsText = ref('')
const showOnCard = ref(false)

const needsOptions = computed(() => props.choiceTypes.includes(type.value))

const parsedOptions = computed(() =>
  optionsText.value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean),
)

async function onSubmit() {
  const trimmed = name.value.trim()
  if (!trimmed) return
  if (needsOptions.value && parsedOptions.value.length < 2) return

  try {
    await props.onCreate({
      name: trimmed,
      type: type.value,
      options: needsOptions.value ? parsedOptions.value : undefined,
      showOnCard: showOnCard.value,
    })
    name.value = ''
    optionsText.value = ''
    showOnCard.value = false
    type.value = 'TEXT'
  } catch {
    /* ignore */
  }
}
</script>
