<template>
  <div class="task-drawer-overlay" role="presentation" @click="onClose?.()">
    <aside
      class="task-drawer"
      role="dialog"
      aria-modal="true"
      aria-label="Редактирование задачи"
      data-testid="task-detail-drawer"
      @click.stop
    >
      <TaskDrawerHeader :column-name="columnName" :on-close="onClose" />
      <div class="task-drawer__body">
        <div ref="formHost" />
        <div ref="sectionsHost" />
        <div ref="commentsHost" />
      </div>
    </aside>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import TaskDrawerHeader from './TaskDrawerHeader.vue';

const props = defineProps({
  columnName: { type: String, default: '' },
  onClose: { type: Function, default: null },
  onHostsReady: { type: Function, default: null },
});

const formHost = ref(null);
const sectionsHost = ref(null);
const commentsHost = ref(null);

function notifyHosts() {
  props.onHostsReady?.({
    form: formHost.value,
    sections: sectionsHost.value,
    comments: commentsHost.value,
  });
}

onMounted(notifyHosts);
watch([formHost, sectionsHost, commentsHost], notifyHosts);
onBeforeUnmount(() => props.onHostsReady?.({ form: null, sections: null, comments: null }));
</script>
