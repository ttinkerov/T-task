<template>
  <span
    class="tag-chip"
    :style="{ background: color + '22', color: color }"
  >
    <i :style="{ background: color }" />
    {{ name }}
  </span>
</template>

<script setup>
defineProps({
  name: { type: String, required: true },
  color: { type: String, required: true },
})
</script>
