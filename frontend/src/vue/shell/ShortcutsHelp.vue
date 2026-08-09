<template>
  <div
    v-if="open"
    class="shortcuts-help-overlay"
    role="presentation"
    @click="onClose?.()"
  >
    <div
      class="shortcuts-help"
      role="dialog"
      aria-modal="true"
      aria-label="Клавиатурные сокращения"
      @click.stop
    >
      <header class="shortcuts-help__header">
        <div>
          <p class="shortcuts-help__eyebrow">Power user</p>
          <h2>Шорткаты</h2>
        </div>
        <button type="button" class="btn-ghost" aria-label="Закрыть" @click="onClose?.()">×</button>
      </header>
      <ul class="shortcuts-help__list">
        <li>
          <kbd>⌘K</kbd>
          <span>Быстрый переход к задачам</span>
        </li>
        <li v-for="shortcut in entries" :key="shortcut.id">
          <kbd>{{ shortcut.label }}</kbd>
          <span>
            {{ shortcut.description
            }}{{ shortcut.scope === 'task' ? ' (в карточке)' : '' }}
          </span>
        </li>
        <li>
          <kbd>Esc</kbd>
          <span>Закрыть панель / сбросить выбор</span>
        </li>
      </ul>
      <p class="shortcuts-help__hint">Не работают, пока курсор в поле ввода.</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  open: { type: Boolean, default: false },
  entries: { type: Array, default: () => [] },
  onClose: { type: Function, default: null },
})
</script>
