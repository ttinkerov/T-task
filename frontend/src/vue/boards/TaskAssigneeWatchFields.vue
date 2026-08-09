<template>
  <div class="task-drawer__grid">
    <label class="task-drawer__field">
      <span class="task-drawer__label">
        Исполнитель
        <FieldHint text="Кто отвечает за выполнение задачи. Видит её в «Мои задачи»." />
      </span>
      <p v-if="loadError" class="text-sm text-red-400" role="alert">
        {{ loadError }}
        <button type="button" class="board-filters__chip" @click="onRetry?.()">Повторить</button>
      </p>
      <select
        v-else
        class="glass-input"
        :value="assigneeId"
        @change="onAssigneeChange?.($event.target.value)"
      >
        <option value="">Не назначен</option>
        <option v-for="member in members" :key="member.userId" :value="member.userId">
          {{ member.user.name }}
        </option>
      </select>
    </label>

    <div class="task-drawer__field">
      <span class="task-drawer__label">
        Наблюдение
        <FieldHint text="Подписка на уведомления по задаче, даже если вы не исполнитель." />
      </span>
      <button type="button" class="btn-ghost" :disabled="togglePending" @click="onToggleWatch?.()">
        <ShellIcon :name="watching ? 'eye-off' : 'eye'" :size="14" />
        {{ watching ? 'Не следить' : 'Следить' }}
      </button>
      <p v-if="watchersLabel" class="settings-card__hint">Следят: {{ watchersLabel }}</p>
      <p v-if="actionError" class="text-sm text-red-400" role="alert">{{ actionError }}</p>
    </div>
  </div>
</template>

<script setup>
import FieldHint from './FieldHint.vue';
import ShellIcon from '../shell/ShellIcon.vue';

defineProps({
  assigneeId: { type: String, default: '' },
  members: { type: Array, default: () => [] },
  watching: { type: Boolean, default: false },
  watchersLabel: { type: String, default: '' },
  togglePending: { type: Boolean, default: false },
  loadError: { type: String, default: '' },
  actionError: { type: String, default: '' },
  onAssigneeChange: { type: Function, default: null },
  onToggleWatch: { type: Function, default: null },
  onRetry: { type: Function, default: null },
});
</script>
