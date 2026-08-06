<template>
  <div>
    <p v-if="saveError" class="text-sm text-red-400">{{ saveError }}</p>

    <div class="task-drawer__actions">
      <button
        type="button"
        class="btn-ghost task-drawer__danger"
        :disabled="deletePending"
        @click="onDelete?.()"
      >
        Удалить
      </button>
      <button type="submit" class="btn-primary" :disabled="isSaving || !canSave">
        {{ isSaving ? 'Сохранение...' : 'Сохранить' }}
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  isSaving: { type: Boolean, default: false },
  canSave: { type: Boolean, default: false },
  saveError: { type: String, default: '' },
  deletePending: { type: Boolean, default: false },
  onDelete: { type: Function, default: null },
})
</script>
