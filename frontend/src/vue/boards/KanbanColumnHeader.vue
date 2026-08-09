<template>
  <input
    v-if="editingName"
    class="kanban-column__title-input"
    :value="columnName"
    maxlength="80"
    autofocus
    @input="columnName = $event.target.value"
    @blur="submitRename"
    @keydown="onRenameKeydown"
  />
  <button
    v-else
    type="button"
    class="kanban-column__title"
    title="Переименовать"
    @click="startRename"
  >
    {{ name }}
  </button>

  <span class="kanban-column__count" :class="{ 'kanban-column__count--over': overWip }">
    {{ countLabel }}
  </span>

  <input
    v-if="canManageAutomations"
    type="number"
    min="1"
    max="999"
    class="kanban-column__wip-input"
    title="WIP-лимит"
    aria-label="WIP-лимит колонки"
    :value="wipLimitValue"
    placeholder="WIP"
    @blur="onWipBlur"
    @click.stop
  />
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  name: { type: String, default: '' },
  countLabel: { type: String, default: '0' },
  overWip: { type: Boolean, default: false },
  canManageAutomations: { type: Boolean, default: false },
  wipLimitValue: { type: [String, Number], default: '' },
  onRename: { type: Function, default: null },
  onWipChange: { type: Function, default: null },
})

const editingName = ref(false)
const columnName = ref(props.name)

watch(
  () => props.name,
  (next) => {
    if (!editingName.value) columnName.value = next
  },
)

function startRename() {
  columnName.value = props.name
  editingName.value = true
}

async function submitRename() {
  try {
    await props.onRename?.(columnName.value)
    editingName.value = false
  } catch {
    /* keep editing open; error shown by parent */
  }
}

function onRenameKeydown(event) {
  if (event.key === 'Enter') {
    event.preventDefault()
    void submitRename()
  }
  if (event.key === 'Escape') {
    columnName.value = props.name
    editingName.value = false
  }
}

function onWipBlur(event) {
  props.onWipChange?.(event.target.value)
}
</script>
