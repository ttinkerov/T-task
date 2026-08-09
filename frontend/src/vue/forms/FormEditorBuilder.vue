<template>
  <div>
    <div class="forms-editor__settings">
      <label class="forms-editor__checkbox">
        <input
          type="checkbox"
          :checked="createTaskOnSubmit"
          @change="onUpdateMeta({ createTaskOnSubmit: $event.target.checked })"
        />
        Создавать задачу на доске при отправке ответа
      </label>
      <label class="forms-editor__checkbox">
        <input
          type="checkbox"
          :checked="isPublic"
          @change="onUpdateMeta({ isPublic: $event.target.checked })"
        />
        Форма доступна по публичной ссылке
      </label>
    </div>

    <div class="forms-editor__grid">
      <section class="forms-panel">
        <h2 class="forms-panel__title">Поля формы</h2>
        <p v-if="fields.length === 0" class="forms-panel__empty">Добавьте первое поле справа.</p>
        <ul v-else class="forms-fields">
          <li v-for="(field, index) in fields" :key="field.id" class="forms-fields__item">
            <div>
              <p class="forms-fields__label">
                {{ index + 1 }}. {{ field.label }}{{ field.required ? ' *' : '' }}
              </p>
              <p class="forms-fields__type">{{ typeLabels[field.type] || field.type }}</p>
              <p v-if="field.options && field.options.length" class="forms-fields__options">
                {{ field.options.join(' · ') }}
              </p>
            </div>
            <button
              type="button"
              class="btn-ghost forms-list__danger"
              :disabled="isDeletingField"
              @click="onDeleteField(field.id)"
            >
              Удалить
            </button>
          </li>
        </ul>
      </section>

      <section class="forms-panel">
        <h2 class="forms-panel__title">Добавить поле</h2>
        <form class="forms-add-field" @submit.prevent="onSubmit">
          <label class="task-drawer__field">
            <span>Тип поля</span>
            <select v-model="fieldType" class="glass-input">
              <option
                v-for="option in typeOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
          </label>

          <label class="task-drawer__field">
            <span>Вопрос</span>
            <input v-model="fieldLabel" class="glass-input" maxlength="200" required />
          </label>

          <label
            v-if="fieldType === 'SINGLE_CHOICE' || fieldType === 'MULTIPLE_CHOICE'"
            class="task-drawer__field"
          >
            <span>Варианты (по одному на строку)</span>
            <textarea
              v-model="fieldOptions"
              class="glass-input task-drawer__textarea"
              rows="4"
              placeholder="Да&#10;Нет&#10;Не знаю"
            />
          </label>

          <label class="forms-editor__checkbox">
            <input v-model="fieldRequired" type="checkbox" />
            Обязательное поле
          </label>

          <button
            type="submit"
            class="btn-primary"
            :disabled="!fieldLabel.trim() || isAddingField"
          >
            Добавить поле
          </button>
        </form>
      </section>
    </div>

    <p v-if="actionError" class="text-sm text-red-400" role="alert">{{ actionError }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  fields: { type: Array, required: true },
  createTaskOnSubmit: { type: Boolean, default: false },
  isPublic: { type: Boolean, default: false },
  typeOptions: { type: Array, required: true },
  typeLabels: { type: Object, required: true },
  isAddingField: { type: Boolean, default: false },
  isDeletingField: { type: Boolean, default: false },
  actionError: { type: String, default: '' },
  onUpdateMeta: { type: Function, required: true },
  onAddField: { type: Function, required: true },
  onDeleteField: { type: Function, required: true },
})

const fieldType = ref(props.typeOptions[0]?.value || 'SHORT_TEXT')
const fieldLabel = ref('')
const fieldOptions = ref('')
const fieldRequired = ref(false)

async function onSubmit() {
  const trimmed = fieldLabel.value.trim()
  if (!trimmed) return

  const options =
    fieldType.value === 'SINGLE_CHOICE' || fieldType.value === 'MULTIPLE_CHOICE'
      ? fieldOptions.value
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean)
      : undefined

  try {
    await props.onAddField({
      type: fieldType.value,
      label: trimmed,
      options,
      required: fieldRequired.value,
    })
    fieldLabel.value = ''
    fieldOptions.value = ''
    fieldRequired.value = false
  } catch {
    /* ignore */
  }
}
</script>
