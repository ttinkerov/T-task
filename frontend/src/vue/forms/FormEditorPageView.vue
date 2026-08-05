<template>
  <div class="forms-page">
    <header class="forms-page__header">
      <div>
        <a href="/dashboard/forms" class="forms-page__back">← Все формы</a>
        <h1 class="forms-page__title">{{ title }}</h1>
        <p class="forms-page__subtitle">
          {{ responseCount }} ответов · {{ fields.length }} полей
        </p>
      </div>
    </header>

    <div class="forms-editor__toolbar">
      <div class="forms-editor__tabs" role="tablist">
        <button
          type="button"
          role="tab"
          :class="[
            'forms-editor__tab',
            { 'forms-editor__tab--active': tab === 'builder' },
          ]"
          @click="tab = 'builder'"
        >
          Конструктор
        </button>
        <button
          type="button"
          role="tab"
          :class="[
            'forms-editor__tab',
            { 'forms-editor__tab--active': tab === 'responses' },
          ]"
          @click="tab = 'responses'"
        >
          Ответы ({{ responsesTotal }})
        </button>
      </div>

      <div class="forms-editor__share">
        <input :value="publicUrl" readonly class="glass-input forms-editor__link" />
        <button type="button" class="btn-ghost" @click="copyLink">
          {{ copied ? 'Скопировано' : 'Копировать' }}
        </button>
      </div>
    </div>

    <FormEditorBuilder
      v-if="tab === 'builder'"
      :fields="fields"
      :create-task-on-submit="createTaskOnSubmit"
      :is-public="isPublic"
      :type-options="typeOptions"
      :type-labels="typeLabels"
      :is-adding-field="isAddingField"
      :is-deleting-field="isDeletingField"
      :on-update-meta="onUpdateMeta"
      :on-add-field="onAddField"
      :on-delete-field="onDeleteField"
    />

    <FormResponses
      v-else
      :fields="fields"
      :responses-data="responsesData"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import FormEditorBuilder from './FormEditorBuilder.vue'
import FormResponses from './FormResponses.vue'

const props = defineProps({
  title: { type: String, required: true },
  publicToken: { type: String, required: true },
  fields: { type: Array, required: true },
  responseCount: { type: Number, default: 0 },
  createTaskOnSubmit: { type: Boolean, default: false },
  isPublic: { type: Boolean, default: false },
  typeOptions: { type: Array, required: true },
  typeLabels: { type: Object, required: true },
  isAddingField: { type: Boolean, default: false },
  isDeletingField: { type: Boolean, default: false },
  responsesData: { type: Object, default: null },
  onUpdateMeta: { type: Function, required: true },
  onAddField: { type: Function, required: true },
  onDeleteField: { type: Function, required: true },
})

const tab = ref('builder')
const origin = ref('')
const copied = ref(false)
let copiedTimer = null

onMounted(() => {
  origin.value = window.location.origin
})

const publicUrl = computed(() =>
  origin.value ? origin.value + '/f/' + props.publicToken : '/f/' + props.publicToken,
)

const responsesTotal = computed(
  () => props.responsesData?.total ?? props.responseCount,
)

async function copyLink() {
  try {
    await navigator.clipboard.writeText(publicUrl.value)
    copied.value = true
    if (copiedTimer) clearTimeout(copiedTimer)
    copiedTimer = setTimeout(() => {
      copied.value = false
    }, 1500)
  } catch {
    /* clipboard may be unavailable */
  }
}
</script>
