<template>
  <div class="automation-dialog__backdrop" @mousedown="onClose?.()">
    <div
      ref="dialogEl"
      class="automation-dialog"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      tabindex="-1"
      @mousedown.stop
    >
      <div class="automation-dialog__header">
        <div>
          <span class="automation-dialog__eyebrow">Автоматизация колонки</span>
          <h2 :id="titleId">{{ columnName }}</h2>
        </div>
        <button
          type="button"
          class="automation-dialog__close"
          aria-label="Закрыть"
          @click="onClose?.()"
        >
          ×
        </button>
      </div>

      <p class="automation-dialog__description">
        Выбранные действия выполнятся один раз, когда задача попадёт в эту колонку.
      </p>

      <form @submit.prevent="submit">
        <label class="automation-dialog__field">
          <span>Назначить исполнителя</span>
          <select v-model="assignUserId">
            <option value="">Не назначать</option>
            <option v-for="member in members" :key="member.userId" :value="member.userId">
              {{ member.name }} · {{ member.email }}
            </option>
          </select>
        </label>

        <label class="automation-dialog__option">
          <input type="checkbox" :checked="startTimer" @change="onStartTimerChange" />
          <span>
            <strong>Запустить таймер</strong>
            <small>Начать учёт времени, если таймер ещё не запущен</small>
          </span>
        </label>

        <label class="automation-dialog__option">
          <input type="checkbox" :checked="completeTask" @change="onCompleteTaskChange" />
          <span>
            <strong>Выполнить задачу</strong>
            <small>Остановить таймер, записать время и сбросить просрочку</small>
          </span>
        </label>

        <p class="automation-dialog__error" role="alert">{{ error }}</p>

        <div class="automation-dialog__actions">
          <button type="button" class="btn-secondary" @click="onClose?.()">Отмена</button>
          <button type="submit" class="btn-primary" :disabled="pending">
            {{ pending ? 'Сохранение…' : 'Сохранить' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

const props = defineProps({
  titleId: { type: String, default: 'automation-dialog-title' },
  columnName: { type: String, default: '' },
  members: { type: Array, default: () => [] },
  initialAssignUserId: { type: String, default: '' },
  initialStartTimer: { type: Boolean, default: false },
  initialCompleteTask: { type: Boolean, default: false },
  pending: { type: Boolean, default: false },
  error: { type: String, default: '' },
  onSave: { type: Function, default: null },
  onClose: { type: Function, default: null },
})

const dialogEl = ref(null)
const assignUserId = ref(props.initialAssignUserId)
const startTimer = ref(props.initialStartTimer)
const completeTask = ref(props.initialCompleteTask)
let previousFocus = null
let keyHandler = null

onMounted(() => {
  previousFocus = document.activeElement
  dialogEl.value?.focus()

  keyHandler = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      props.onClose?.()
      return
    }

    if (event.key !== 'Tab' || !dialogEl.value) return

    const focusable = Array.from(dialogEl.value.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
      (element) => !element.hasAttribute('disabled') && element.tabIndex !== -1,
    )

    if (focusable.length === 0) {
      event.preventDefault()
      dialogEl.value.focus()
      return
    }

    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    const active = document.activeElement

    if (event.shiftKey && (active === first || !dialogEl.value.contains(active))) {
      event.preventDefault()
      last.focus()
      return
    }

    if (!event.shiftKey && (active === last || !dialogEl.value.contains(active))) {
      event.preventDefault()
      first.focus()
    }
  }

  window.addEventListener('keydown', keyHandler)
})

onBeforeUnmount(() => {
  if (keyHandler) window.removeEventListener('keydown', keyHandler)
  previousFocus?.focus?.()
})

function onStartTimerChange(event) {
  startTimer.value = event.target.checked
  if (event.target.checked) completeTask.value = false
}

function onCompleteTaskChange(event) {
  completeTask.value = event.target.checked
  if (event.target.checked) startTimer.value = false
}

async function submit() {
  await props.onSave?.({
    assignUserId: assignUserId.value || null,
    startTimer: startTimer.value,
    completeTask: completeTask.value,
  })
}
</script>
