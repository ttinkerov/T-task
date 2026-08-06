<template>
  <span class="mention-text-root">
    <template v-for="(token, index) in tokens" :key="token.key || index">
      <span v-if="token.kind === 'mention'" class="mention-text">{{ token.value }}</span>
      <span v-else>{{ token.value }}</span>
    </template>
  </span>
</template>

<script setup>
defineProps({
  tokens: { type: Array, default: () => [] },
})
</script>
