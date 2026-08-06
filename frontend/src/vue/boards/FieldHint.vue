<template>
  <span class="field-hint">
    <button
      type="button"
      class="field-hint__btn"
      :aria-label="'Подсказка: ' + text"
      :title="text"
    >
      ?
    </button>
  </span>
</template>

<script setup>
defineProps({
  text: { type: String, required: true },
})
</script>
