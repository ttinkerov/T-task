<template>
  <section class="task-subtasks" aria-labelledby="task-deals-title">
    <div class="task-subtasks__header">
      <h3 id="task-deals-title" class="task-drawer__section-title">
        Сделки
        <FieldHint
          text="Связь задачи с CRM-сделкой: видно, к какому клиенту/продаже она относится."
        />
      </h3>
      <span>{{ links.length }}</span>
    </div>

    <p v-if="isLoading" role="status">Загрузка связей...</p>

    <p v-else-if="links.length === 0" class="task-tags__empty">Нет связанных сделок</p>

    <ul v-else class="task-subtasks__list" role="list">
      <li v-for="link in links" :key="link.dealId">
        <span>
          {{ link.title }}
          <small class="task-deals__meta"> · {{ link.meta }}</small>
        </span>
        <button
          type="button"
          :aria-label="'Отвязать сделку ' + link.title"
          :disabled="unlinkPending"
          @click="onUnlink?.(link.dealId)"
        >
          ×
        </button>
      </li>
    </ul>

    <form class="task-subtasks__create task-deals__form" @submit.prevent="submit">
      <select v-model="localFunnelId" aria-label="Воронка" @change="onFunnelChange">
        <option value="">Воронка</option>
        <option v-for="funnel in funnels" :key="funnel.id" :value="funnel.id">
          {{ funnel.name }}
        </option>
      </select>
      <select v-model="dealId" :disabled="!localFunnelId" aria-label="Сделка">
        <option value="">Сделка</option>
        <option v-for="deal in dealOptions" :key="deal.id" :value="deal.id">
          {{ deal.label }}
        </option>
      </select>
      <button type="submit" :disabled="!dealId || linkPending">Связать</button>
    </form>

    <p v-if="error" class="text-sm text-red-400" role="alert">{{ error }}</p>
  </section>
</template>

<script setup>
import { ref, watch } from 'vue'
import FieldHint from './FieldHint.vue'

const props = defineProps({
  links: { type: Array, default: () => [] },
  funnels: { type: Array, default: () => [] },
  dealOptions: { type: Array, default: () => [] },
  funnelId: { type: String, default: '' },
  isLoading: { type: Boolean, default: false },
  linkPending: { type: Boolean, default: false },
  unlinkPending: { type: Boolean, default: false },
  error: { type: String, default: '' },
  onFunnelSelect: { type: Function, default: null },
  onLink: { type: Function, default: null },
  onUnlink: { type: Function, default: null },
})

const localFunnelId = ref(props.funnelId)
const dealId = ref('')

watch(
  () => props.funnelId,
  (next) => {
    localFunnelId.value = next
  },
)

function onFunnelChange() {
  dealId.value = ''
  props.onFunnelSelect?.(localFunnelId.value)
}

async function submit() {
  if (!dealId.value) return
  try {
    await props.onLink?.(dealId.value)
    dealId.value = ''
  } catch {
    /* ignore */
  }
}
</script>
