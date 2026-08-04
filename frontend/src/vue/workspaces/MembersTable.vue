<template>
  <p v-if="isLoading" class="text-sm text-muted-foreground">Загрузка участников...</p>

  <div v-else class="overflow-x-auto">
    <table class="settings-table">
      <thead>
        <tr>
          <th>Участник</th>
          <th>Роль</th>
          <th v-if="canManage">Доп. права</th>
          <th v-if="canManage">Действия</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="member in members" :key="member.id">
          <td>
            <p class="font-medium">{{ member.user.name }}</p>
            <p class="text-xs text-muted-foreground">{{ member.user.email }}</p>
          </td>
          <td>
            <select
              v-if="canManage && member.userId !== currentUserId"
              class="glass-input py-1.5"
              :value="member.role"
              @change="
                emit('update-role', { memberId: member.id, role: $event.target.value })
              "
            >
              <option v-for="role in assignableRoles" :key="role" :value="role">
                {{ role }}
              </option>
            </select>
            <span v-else class="settings-badge">{{ member.role }}</span>
          </td>
          <td v-if="canManage">
            <div
              v-if="member.role === 'VIEWER' && member.userId !== currentUserId"
              style="display: flex; flex-wrap: wrap; gap: 0.35rem"
            >
              <label
                v-for="scope in extraScopes"
                :key="scope.id"
                class="text-xs"
                style="display: inline-flex; gap: 0.25rem"
              >
                <input
                  type="checkbox"
                  :checked="(member.scopes || []).includes(scope.id)"
                  @change="onScopeToggle(member, scope.id)"
                />
                {{ scope.label }}
              </label>
            </div>
            <span v-else class="text-xs text-muted-foreground">по роли</span>
          </td>
          <td v-if="canManage">
            <button
              v-if="member.userId !== currentUserId"
              type="button"
              class="text-sm text-red-400 hover:text-red-300"
              @click="emit('remove', member.id)"
            >
              Удалить
            </button>
            <span v-else class="text-xs text-muted-foreground">Вы</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
defineProps({
  members: { type: Array, required: true },
  isLoading: { type: Boolean, default: false },
  currentUserId: { type: String, required: true },
  canManage: { type: Boolean, default: false },
  assignableRoles: { type: Array, required: true },
  extraScopes: { type: Array, required: true },
})

const emit = defineEmits(['update-role', 'update-scopes', 'remove'])

function onScopeToggle(member, scopeId) {
  const scopes = member.scopes || []
  const checked = scopes.includes(scopeId)
  const next = checked ? scopes.filter((item) => item !== scopeId) : [...scopes, scopeId]
  emit('update-scopes', { memberId: member.id, scopes: next })
}
</script>
