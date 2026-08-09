<template>
  <div :key="pathKey" :class="rootClass" :data-reduced="reduceMotion ? 'true' : undefined">
    <div ref="host" class="dashboard-page-transition__host" />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

const props = defineProps({
  pathKey: { type: String, default: '' },
  fill: { type: Boolean, default: false },
  reduceMotion: { type: Boolean, default: false },
  onHostReady: { type: Function, default: null },
});

const host = ref(null);

const rootClass = computed(() => {
  const parts = ['dashboard-page-transition'];
  if (props.fill) parts.push('dashboard-page-transition--fill');
  if (!props.reduceMotion) parts.push('dashboard-page-transition--animate');
  return parts.join(' ');
});

function notify(el) {
  props.onHostReady?.(el);
}

onMounted(() => notify(host.value));
watch(host, (el) => notify(el));
onBeforeUnmount(() => notify(null));
</script>
