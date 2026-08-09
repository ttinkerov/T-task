<template>
  <div class="task-drawer__grid">
    <label class="task-drawer__field">
      <span class="task-drawer__label">
        Исполнитель
        <FieldHint text="Кто отвечает за выполнение задачи. Видит её в «Мои задачи»." />
      </span>
      <select
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
  onAssigneeChange: { type: Function, default: null },
  onToggleWatch: { type: Function, default: null },
});
</script>
