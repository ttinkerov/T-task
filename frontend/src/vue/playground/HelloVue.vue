<template>
  <section class="max-w-sm rounded-lg border border-zinc-300 p-4">
    <h2 class="mb-2 text-lg font-semibold">{{ title }}</h2>
    <p class="mb-3 text-sm text-zinc-600">Кликов: {{ clicks }}</p>

    <button
      type="button"
      class="cursor-pointer rounded border border-zinc-400 px-3 py-2 text-sm"
      @click="clicks += 1"
    >
      Жми
    </button>
  </section>
</template>

<!-- В Next+SWC: без lang="ts" на SFC (SWC парсит .vue как JS). -->
<!-- Без <style>: Next ругается на CSS из .vue как на global CSS. Tailwind — ок. -->
<script setup>
import { ref } from 'vue'

defineProps({
  title: { type: String, required: true },
})

const clicks = ref(0)
</script>
