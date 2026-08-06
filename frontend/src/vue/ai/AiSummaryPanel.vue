<template>
  <div
    v-if="configured && !(scope === 'sprint' && !sprintId)"
    class="ai-summary"
    :class="{ 'ai-summary--compact': compact }"
  >
    <div class="ai-summary__head">
      <div>
        <p class="ai-summary__eyebrow">ИИ</p>
        <strong>{{ scope === 'sprint' ? 'Саммари спринта' : 'Саммари дня' }}</strong>
      </div>
      <div class="ai-summary__actions">
        <input
          v-if="scope === 'day'"
          v-model="date"
          class="glass-input ai-summary__date"
          type="date"
        />
        <button
          type="button"
          class="btn-primary"
          :disabled="isPending"
          @click="generate"
        >
          {{ isPending ? 'Генерируем…' : 'Сгенерировать' }}
        </button>
      </div>
    </div>

    <p v-if="error" class="ai-summary__error">{{ error }}</p>

    <div v-if="result" class="ai-summary__body">
      <p class="ai-summary__stats">{{ statsLine }}</p>
      <div class="ai-summary__text">{{ result.summary }}</div>
      <p class="ai-summary__meta">{{ result.model }}</p>
    </div>
    <p v-else class="ai-summary__hint">
      {{
        scope === 'sprint'
          ? 'Краткий обзор закрытых и открытых задач спринта.'
          : 'Сводка по задачам, закрытым за выбранный день.'
      }}
    </p>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  configured: { type: Boolean, default: false },
  scope: { type: String, required: true },
  sprintId: { type: String, default: '' },
  compact: { type: Boolean, default: false },
  isPending: { type: Boolean, default: false },
  onGenerate: { type: Function, default: null },
})

function todayIsoDate() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return year + '-' + month + '-' + day
}

const date = ref(todayIsoDate())
const result = ref(null)
const error = ref('')

watch(
  () => [props.scope, props.sprintId, date.value],
  () => {
    result.value = null
    error.value = ''
  },
)

const statsLine = computed(() => {
  if (!result.value) return ''
  const stats = result.value.stats
  let line = 'Закрыто: ' + stats.completedCount
  if (stats.completedPoints > 0) line += ' · ' + stats.completedPoints + ' SP'
  if (props.scope === 'sprint') line += ' · открыто: ' + stats.openCount
  if (stats.topAssignees?.[0]) line += ' · топ: ' + stats.topAssignees[0].name
  return line
})

async function generate() {
  error.value = ''
  try {
    const data = await props.onGenerate?.(
      props.scope === 'sprint'
        ? { scope: 'sprint', sprintId: props.sprintId }
        : { scope: 'day', date: date.value },
    )
    result.value = data
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Не удалось получить саммари'
  }
}
</script>
