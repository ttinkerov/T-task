<template>
  <p v-if="isLoading" class="text-sm text-muted-foreground">Загрузка приглашений...</p>

  <p v-else-if="invitations.length === 0" class="text-sm text-muted-foreground">
    Активных приглашений нет.
  </p>

  <ul v-else class="settings-invite-list">
    <li v-for="invitation in invitations" :key="invitation.id" class="settings-invite-item">
      <div>
        <p class="text-sm font-medium">{{ invitation.email }}</p>
        <p class="text-xs text-muted-foreground">
          {{ invitation.role }} · до {{ formatExpiresAt(invitation.expiresAt) }}
        </p>
      </div>
      <button
        type="button"
        class="text-sm text-red-400 hover:text-red-300"
        :disabled="isRevoking && pendingId === invitation.id"
        @click="emit('revoke', invitation.id)"
      >
        {{ isRevoking && pendingId === invitation.id ? '…' : 'Отозвать' }}
      </button>
    </li>
  </ul>
</template>

<script setup>
defineProps({
  invitations: { type: Array, required: true },
  isLoading: { type: Boolean, default: false },
  isRevoking: { type: Boolean, default: false },
  pendingId: { type: String, default: null },
})

const emit = defineEmits(['revoke'])

function formatExpiresAt(value) {
  return new Date(value).toLocaleDateString('ru-RU')
}
</script>
