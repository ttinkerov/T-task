<template>
  <input
    v-if="editingName"
    class="kanban-column__title-input"
    :value="stageName"
    maxlength="80"
    autofocus
    @input="stageName = $event.target.value"
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

  <span class="kanban-column__count">{{ countLabel }}</span>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  name: { type: String, default: '' },
  countLabel: { type: String, default: '0' },
  onRename: { type: Function, default: null },
})

const editingName = ref(false)
const stageName = ref(props.name)

watch(
  () => props.name,
  (next) => {
    if (!editingName.value) stageName.value = next
  },
)

function startRename() {
  stageName.value = props.name
  editingName.value = true
}

async function submitRename() {
  await props.onRename?.(stageName.value)
  editingName.value = false
}

function onRenameKeydown(event) {
  if (event.key === 'Enter') {
    event.preventDefault()
    void submitRename()
  }
  if (event.key === 'Escape') {
    stageName.value = props.name
    editingName.value = false
  }
}
</script>
