<template>
  <p v-if="isLoading" class="text-sm text-muted-foreground">Загрузка участников...</p>

  <div v-else-if="isError" role="alert">
    <p class="settings-inline-error">{{ loadError || 'Не удалось загрузить участников' }}</p>
    <button type="button" class="btn-ghost" @click="onRetryLoad?.()">Повторить</button>
  </div>

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
                onUpdateRole?.({ memberId: member.id, role: $event.target.value })
              "
            >
              <option v-for="role in assignableRoles" :key="role.value" :value="role.value">
                {{ role.label }}
              </option>
            </select>
            <span v-else class="settings-badge">{{
              roleLabels[member.role] || member.role
            }}</span>
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
              @click="onRemove?.(member.id)"
            >
              Удалить
            </button>
            <span v-else class="text-xs text-muted-foreground">Вы</span>
          </td>
        </tr>
      </tbody>
    </table>

    <p v-if="actionError" class="settings-inline-error" role="alert">{{ actionError }}</p>
  </div>
</template>

<script setup>
const props = defineProps({
  members: { type: Array, required: true },
  isLoading: { type: Boolean, default: false },
  isError: { type: Boolean, default: false },
  loadError: { type: String, default: '' },
  actionError: { type: String, default: '' },
  currentUserId: { type: String, required: true },
  canManage: { type: Boolean, default: false },
  assignableRoles: { type: Array, required: true },
  roleLabels: { type: Object, default: () => ({}) },
  extraScopes: { type: Array, required: true },
  onRetryLoad: { type: Function, default: null },
  onUpdateRole: { type: Function, default: null },
  onUpdateScopes: { type: Function, default: null },
  onRemove: { type: Function, default: null },
})

function onScopeToggle(member, scopeId) {
  const scopes = member.scopes || []
  const checked = scopes.includes(scopeId)
  const next = checked ? scopes.filter((item) => item !== scopeId) : [...scopes, scopeId]
  props.onUpdateScopes?.({ memberId: member.id, scopes: next })
}
</script>
