<template>
  <div v-if="workspaces.length" class="workspace-switcher">
    <select
      class="workspace-switcher__select"
      :value="currentWorkspaceId"
      aria-label="Выбор команды"
      @change="onChange?.($event.target.value)"
    >
      <option v-for="workspace in workspaces" :key="workspace.id" :value="workspace.id">
        {{ workspace.name }}
      </option>
    </select>
  </div>
</template>

<script setup>
defineProps({
  workspaces: { type: Array, default: () => [] },
  currentWorkspaceId: { type: String, default: '' },
  onChange: { type: Function, default: null },
})
</script>
