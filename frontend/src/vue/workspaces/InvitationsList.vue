<template>
  <p v-if="isLoading" class="text-sm text-muted-foreground">Загрузка приглашений...</p>

  <div v-else-if="isError" role="alert">
    <p class="settings-inline-error">{{ loadError || 'Не удалось загрузить приглашения' }}</p>
    <button type="button" class="btn-ghost" @click="onRetryLoad?.()">Повторить</button>
  </div>

  <p v-else-if="invitations.length === 0" class="text-sm text-muted-foreground">
    Активных приглашений нет.
  </p>

  <div v-else>
    <ul class="settings-invite-list">
      <li v-for="invitation in invitations" :key="invitation.id" class="settings-invite-item">
        <div>
          <p class="text-sm font-medium">{{ invitation.email }}</p>
          <p class="text-xs text-muted-foreground">
            {{ roleLabels[invitation.role] || invitation.role }} · до
            {{ formatExpiresAt(invitation.expiresAt) }}
          </p>
        </div>
        <button
          type="button"
          class="text-sm text-red-400 hover:text-red-300"
          :disabled="isRevoking && pendingId === invitation.id"
          @click="onRevoke?.(invitation.id)"
        >
          {{ isRevoking && pendingId === invitation.id ? '…' : 'Отозвать' }}
        </button>
      </li>
    </ul>

    <p v-if="actionError" class="settings-inline-error" role="alert">{{ actionError }}</p>
  </div>
</template>

<script setup>
defineProps({
  invitations: { type: Array, required: true },
  isLoading: { type: Boolean, default: false },
  isError: { type: Boolean, default: false },
  loadError: { type: String, default: '' },
  actionError: { type: String, default: '' },
  isRevoking: { type: Boolean, default: false },
  pendingId: { type: String, default: null },
  roleLabels: { type: Object, default: () => ({}) },
  onRetryLoad: { type: Function, default: null },
  onRevoke: { type: Function, default: null },
})

function formatExpiresAt(value) {
  return new Date(value).toLocaleDateString('ru-RU')
}
</script>
