<template>
  <div class="min-w-0 flex-1" style="order: 3">
    <p class="kanban-task-card__title">{{ title }}</p>
    <div v-if="hasMeta" class="kanban-task-meta">
      <span v-if="amountLabel" class="kanban-task-chip crm-deal-chip--amount">{{ amountLabel }}</span>
      <span v-if="contactName" class="kanban-task-chip">{{ contactName }}</span>
      <span v-if="companyName" class="kanban-task-chip">{{ companyName }}</span>
      <span v-if="assigneeName" class="kanban-task-chip">{{ assigneeName }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: { type: String, default: '' },
  amountLabel: { type: String, default: '' },
  contactName: { type: String, default: '' },
  companyName: { type: String, default: '' },
  assigneeName: { type: String, default: '' },
})

const hasMeta = computed(
  () =>
    Boolean(props.amountLabel) ||
    Boolean(props.contactName) ||
    Boolean(props.companyName) ||
    Boolean(props.assigneeName),
)
</script>
