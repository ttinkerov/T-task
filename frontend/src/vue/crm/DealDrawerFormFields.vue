<template>
  <div class="task-drawer__form-fields">
    <label class="task-drawer__field">
      <span>Название</span>
      <input
        class="glass-input"
        required
        maxlength="200"
        autofocus
        :value="title"
        @input="onTitleChange?.($event.target.value)"
      />
    </label>

    <label class="task-drawer__field">
      <span>Описание</span>
      <textarea
        class="glass-input task-drawer__textarea"
        rows="3"
        maxlength="2000"
        placeholder="Детали сделки..."
        :value="description"
        @input="onDescriptionChange?.($event.target.value)"
      />
    </label>

    <div class="task-drawer__grid">
      <label class="task-drawer__field">
        <span>Сумма, ₽</span>
        <input
          type="number"
          min="0"
          class="glass-input"
          placeholder="0"
          :value="amount"
          @input="onAmountChange?.($event.target.value)"
        />
      </label>

      <label class="task-drawer__field">
        <span>Ответственный</span>
        <select
          class="glass-input"
          :value="assigneeId"
          :disabled="Boolean(membersLoadError)"
          @change="onAssigneeChange?.($event.target.value)"
        >
          <option value="">Не назначен</option>
          <option v-for="member in members" :key="member.userId" :value="member.userId">
            {{ member.user.name }}
          </option>
        </select>
        <p v-if="membersLoadError" class="text-sm text-red-400" role="alert">
          {{ membersLoadError }}
          <button type="button" class="board-filters__chip" @click="onRetryMembers?.()">
            Повторить
          </button>
        </p>
      </label>
    </div>

    <div class="task-drawer__grid">
      <label class="task-drawer__field">
        <span>Контакт</span>
        <input
          class="glass-input"
          maxlength="120"
          placeholder="Имя клиента"
          :value="contactName"
          @input="onContactNameChange?.($event.target.value)"
        />
      </label>

      <label class="task-drawer__field">
        <span>Компания</span>
        <input
          class="glass-input"
          maxlength="120"
          placeholder="Название компании"
          :value="companyName"
          @input="onCompanyNameChange?.($event.target.value)"
        />
      </label>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  amount: { type: String, default: '' },
  contactName: { type: String, default: '' },
  companyName: { type: String, default: '' },
  assigneeId: { type: String, default: '' },
  members: { type: Array, default: () => [] },
  membersLoadError: { type: String, default: '' },
  onTitleChange: { type: Function, default: null },
  onDescriptionChange: { type: Function, default: null },
  onAmountChange: { type: Function, default: null },
  onContactNameChange: { type: Function, default: null },
  onCompanyNameChange: { type: Function, default: null },
  onAssigneeChange: { type: Function, default: null },
  onRetryMembers: { type: Function, default: null },
});
</script>
