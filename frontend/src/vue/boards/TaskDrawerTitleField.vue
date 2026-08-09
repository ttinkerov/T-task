<template>
  <label class="task-drawer__field">
    <span class="task-drawer__label">Название</span>
    <input
      class="glass-input"
      required
      maxlength="200"
      autofocus
      :value="title"
      @input="onTitleChange?.($event.target.value)"
    />
  </label>
</template>

<script setup>
defineProps({
  title: { type: String, default: '' },
  onTitleChange: { type: Function, default: null },
});
</script>
