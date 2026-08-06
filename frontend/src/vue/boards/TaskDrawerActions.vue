<template>
  <div>
    <p v-if="saveError" class="text-sm text-red-400">{{ saveError }}</p>

    <div class="task-drawer__actions">
      <button type="button" class="btn-ghost" @click="onCopyLink?.()">
        {{ linkCopied ? 'Скопировано' : 'Ссылка' }}
      </button>
      <button
        type="button"
        class="btn-ghost"
        :disabled="duplicatePending"
        @click="onDuplicate?.()"
      >
        {{ duplicatePending ? '…' : 'Дублировать' }}
      </button>
      <button
        type="button"
        class="btn-ghost task-drawer__danger"
        :disabled="deletePending"
        @click="onDelete?.()"
      >
        Удалить
      </button>
      <button type="submit" class="btn-primary" :disabled="isSaving || !canSave">
        {{ isSaving ? '…' : 'Сохранить' }}
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  isSaving: { type: Boolean, default: false },
  canSave: { type: Boolean, default: false },
  saveError: { type: String, default: '' },
  linkCopied: { type: Boolean, default: false },
  duplicatePending: { type: Boolean, default: false },
  deletePending: { type: Boolean, default: false },
  onCopyLink: { type: Function, default: null },
  onDuplicate: { type: Function, default: null },
  onDelete: { type: Function, default: null },
})
</script>
