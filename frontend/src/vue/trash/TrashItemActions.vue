<template>
  <div class="trash-list__actions">
    <button
      type="button"
      class="trash-list__restore"
      :disabled="busy"
      @click="emit('restore')"
    >
      {{ busy ? '…' : 'Восстановить' }}
    </button>
    <button
      v-if="canPurge"
      type="button"
      class="trash-list__purge"
      :disabled="busy"
      @click="onPurgeClick"
    >
      {{ busy ? '…' : 'Удалить навсегда' }}
    </button>
  </div>
</template>

<script setup>
const props = defineProps({
  canPurge: { type: Boolean, default: false },
  busy: { type: Boolean, default: false },
  entityName: { type: String, required: true },
})

const emit = defineEmits(['restore', 'purge'])

function onPurgeClick() {
  const confirmed = window.confirm(
    'Удалить «' + props.entityName + '» навсегда? Это действие нельзя отменить.',
  )
  if (!confirmed) return
  emit('purge')
}
</script>
