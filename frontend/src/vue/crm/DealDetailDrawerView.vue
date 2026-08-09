<template>
  <div class="task-drawer-overlay" role="presentation" @click="onClose?.()">
    <aside
      class="task-drawer"
      role="dialog"
      aria-modal="true"
      aria-label="Редактирование сделки"
      @click.stop
    >
      <DealDrawerHeader :stage-name="stageName" :on-close="onClose" />

      <form class="task-drawer__form" @submit.prevent="onSubmit?.()">
        <DealDrawerFormFields
          :title="title"
          :description="description"
          :amount="amount"
          :contact-name="contactName"
          :company-name="companyName"
          :assignee-id="assigneeId"
          :members="members"
          :members-load-error="membersLoadError"
          :on-title-change="onTitleChange"
          :on-description-change="onDescriptionChange"
          :on-amount-change="onAmountChange"
          :on-contact-name-change="onContactNameChange"
          :on-company-name-change="onCompanyNameChange"
          :on-assignee-change="onAssigneeChange"
          :on-retry-members="onRetryMembers"
        />

        <div ref="templateHost" />

        <DealDrawerActions
          :is-saving="isSaving"
          :can-save="canSave"
          :save-error="saveError"
          :delete-pending="deletePending"
          :on-delete="onDelete"
        />
      </form>

      <div ref="rollupHost" />
      <div ref="tasksHost" />
    </aside>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import DealDrawerActions from './DealDrawerActions.vue';
import DealDrawerFormFields from './DealDrawerFormFields.vue';
import DealDrawerHeader from './DealDrawerHeader.vue';

const props = defineProps({
  stageName: { type: String, default: '' },
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  amount: { type: String, default: '' },
  contactName: { type: String, default: '' },
  companyName: { type: String, default: '' },
  assigneeId: { type: String, default: '' },
  members: { type: Array, default: () => [] },
  membersLoadError: { type: String, default: '' },
  isSaving: { type: Boolean, default: false },
  canSave: { type: Boolean, default: false },
  saveError: { type: String, default: '' },
  deletePending: { type: Boolean, default: false },
  onClose: { type: Function, default: null },
  onSubmit: { type: Function, default: null },
  onDelete: { type: Function, default: null },
  onTitleChange: { type: Function, default: null },
  onDescriptionChange: { type: Function, default: null },
  onAmountChange: { type: Function, default: null },
  onContactNameChange: { type: Function, default: null },
  onCompanyNameChange: { type: Function, default: null },
  onAssigneeChange: { type: Function, default: null },
  onHostsReady: { type: Function, default: null },
  onRetryMembers: { type: Function, default: null },
});

const templateHost = ref(null);
const rollupHost = ref(null);
const tasksHost = ref(null);

function notifyHosts() {
  props.onHostsReady?.({
    template: templateHost.value,
    rollup: rollupHost.value,
    tasks: tasksHost.value,
  });
}

onMounted(notifyHosts);
watch([templateHost, rollupHost, tasksHost], notifyHosts);
onBeforeUnmount(() => props.onHostsReady?.({ template: null, rollup: null, tasks: null }));
</script>
