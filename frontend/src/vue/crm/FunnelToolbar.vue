<template>
  <div class="crm-toolbar">
    <div>
      <h1 class="crm-toolbar__title">CRM — воронки</h1>
      <p class="crm-toolbar__hint">
        Сделки двигаются по этапам, как на канбан-доске. Разные воронки — для разных направлений.
      </p>
    </div>

    <div v-if="showActions" class="crm-toolbar__actions">
      <select
        class="glass-input crm-toolbar__select"
        :value="funnelId"
        @change="onFunnelChange?.($event.target.value)"
      >
        <option v-for="item in funnels" :key="item.id" :value="item.id">{{ item.name }}</option>
      </select>

      <form class="crm-toolbar__create" @submit.prevent="submitCreate">
        <input
          v-model="name"
          placeholder="Новая воронка"
          maxlength="80"
          class="glass-input"
        />
        <button type="submit" class="btn-ghost" :disabled="!name.trim() || createPending">+</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  funnels: { type: Array, default: () => [] },
  funnelId: { type: String, default: '' },
  showActions: { type: Boolean, default: true },
  createPending: { type: Boolean, default: false },
  onFunnelChange: { type: Function, default: null },
  onCreate: { type: Function, default: null },
})

const name = ref('')

async function submitCreate() {
  const next = name.value.trim()
  if (!next) return
  await props.onCreate?.(next)
  name.value = ''
}
</script>
