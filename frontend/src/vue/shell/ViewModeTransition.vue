<template>
  <div :key="modeKey" :class="rootClass" :data-reduced="reduceMotion ? 'true' : undefined">
    <div ref="host" class="view-mode-transition__host" />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

const props = defineProps({
  modeKey: { type: String, default: '' },
  className: { type: String, default: '' },
  reduceMotion: { type: Boolean, default: false },
  onHostReady: { type: Function, default: null },
});

const host = ref(null);

const rootClass = computed(() => {
  const parts = ['view-mode-transition'];
  if (!props.reduceMotion) parts.push('view-mode-transition--animate');
  if (props.className) parts.push(props.className);
  return parts.join(' ');
});

function notify(el) {
  props.onHostReady?.(el);
}

onMounted(() => notify(host.value));
watch(host, (el) => notify(el));
onBeforeUnmount(() => notify(null));
</script>
