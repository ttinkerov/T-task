<template>
  <label v-if="definition.type === 'CHECKBOX'" class="task-custom-fields__checkbox">
    <input
      :id="fieldId"
      type="checkbox"
      :checked="value === true"
      :disabled="disabled"
      @change="onSave?.($event.target.checked)"
    />
    <span>{{ definition.name }}</span>
  </label>

  <label v-else-if="definition.type === 'SELECT'" class="task-custom-fields__field">
    <span>{{ definition.name }}</span>
    <select
      :id="fieldId"
      class="glass-input"
      :value="typeof value === 'string' ? value : ''"
      :disabled="disabled"
      @change="onSave?.($event.target.value || null)"
    >
      <option value="">Не выбрано</option>
      <option v-for="option in options" :key="option" :value="option">
        {{ option }}
      </option>
    </select>
  </label>

  <fieldset
    v-else-if="definition.type === 'MULTI_SELECT'"
    class="task-custom-fields__field task-custom-fields__multiselect"
  >
    <legend>{{ definition.name }}</legend>
    <label
      v-for="option in options"
      :key="option"
      class="task-custom-fields__multiselect-option"
    >
      <input
        type="checkbox"
        :checked="selectedMulti.includes(option)"
        :disabled="disabled"
        @change="toggleMulti(option, $event.target.checked)"
      />
      <span>{{ option }}</span>
    </label>
  </fieldset>

  <label v-else-if="definition.type === 'USER'" class="task-custom-fields__field">
    <span>{{ definition.name }}</span>
    <select
      :id="fieldId"
      class="glass-input"
      :value="typeof value === 'string' ? value : ''"
      :disabled="disabled"
      @change="onSave?.($event.target.value || null)"
    >
      <option value="">Не выбрано</option>
      <option v-for="member in members" :key="member.userId" :value="member.userId">
        {{ member.user.name }}
      </option>
    </select>
  </label>

  <label v-else-if="definition.type === 'DATE'" class="task-custom-fields__field">
    <span>{{ definition.name }}</span>
    <input
      :id="fieldId"
      type="date"
      class="glass-input"
      :value="draft"
      :disabled="disabled"
      @change="onDateChange"
    />
  </label>

  <label v-else-if="definition.type === 'NUMBER'" class="task-custom-fields__field">
    <span>{{ definition.name }}</span>
    <input
      :id="fieldId"
      type="number"
      class="glass-input"
      :value="draft"
      :disabled="disabled"
      @input="draft = $event.target.value"
      @blur="onSave?.(draft.trim() === '' ? null : Number(draft))"
    />
  </label>

  <label v-else class="task-custom-fields__field">
    <span>{{ definition.name }}</span>
    <input
      :id="fieldId"
      :type="definition.type === 'URL' ? 'url' : 'text'"
      class="glass-input"
      :value="draft"
      :disabled="disabled"
      :maxlength="definition.type === 'URL' ? 2048 : 2000"
      :placeholder="definition.type === 'URL' ? 'https://…' : ''"
      @input="draft = $event.target.value"
      @blur="onSave?.(draft.trim() === '' ? null : draft.trim())"
    />
  </label>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  definition: { type: Object, required: true },
  value: { default: null },
  members: { type: Array, default: () => [] },
  disabled: { type: Boolean, default: false },
  onSave: { type: Function, default: null },
})

const fieldId = computed(() => 'custom-field-' + props.definition.id)
const options = computed(() =>
  Array.isArray(props.definition.options) ? props.definition.options : [],
)
const selectedMulti = computed(() => (Array.isArray(props.value) ? props.value : []))
const draft = ref(toInputString(props.value))

watch(
  () => props.value,
  (next) => {
    draft.value = toInputString(next)
  },
)

function toggleMulti(option, checked) {
  const next = checked
    ? [...selectedMulti.value, option]
    : selectedMulti.value.filter((item) => item !== option)
  props.onSave?.(next.length > 0 ? next : null)
}

function onDateChange(event) {
  const next = event.target.value
  draft.value = next
  props.onSave?.(next ? new Date(next + 'T12:00:00').toISOString() : null)
}

function toInputString(value) {
  if (value === null || value === undefined) return ''
  if (Array.isArray(value)) return ''
  if (typeof value === 'boolean') return ''
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) return value.slice(0, 10)
  return String(value)
}
</script>
