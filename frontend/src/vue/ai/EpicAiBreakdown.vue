<template>
  <div v-if="configured" class="epic-ai">
    <div class="epic-ai__actions">
      <button type="button" class="btn-ghost" :disabled="proposePending" @click="propose">
        {{ proposePending ? 'Думаем…' : 'Разбей эпик с ИИ' }}
      </button>
    </div>

    <p v-if="error" class="epic-ai__error">{{ error }}</p>
    <p v-if="successMessage" class="epic-ai__success">{{ successMessage }}</p>

    <div v-if="open" class="epic-ai__panel">
      <label class="epic-ai__field">
        <span>Уточнения (опционально)</span>
        <input
          v-model="instructions"
          class="glass-input"
          maxlength="500"
          placeholder="Например: больше внимания API и тестам"
        />
      </label>

      <ul class="epic-ai__list">
        <li v-for="(draft, index) in drafts" :key="index + '-' + draft.title">
          <input
            class="glass-input"
            :value="draft.title"
            maxlength="200"
            placeholder="Название задачи"
            @input="updateDraft(index, { title: $event.target.value })"
          />
          <textarea
            class="glass-input"
            :value="draft.description"
            maxlength="2000"
            rows="2"
            placeholder="Описание"
            @input="updateDraft(index, { description: $event.target.value })"
          />
          <button type="button" class="btn-ghost" @click="removeDraft(index)">Убрать</button>
        </li>
      </ul>

      <div class="epic-ai__footer">
        <button
          type="button"
          class="btn-primary"
          :disabled="applyPending || drafts.length === 0"
          @click="apply"
        >
          {{ applyPending ? 'Создаём…' : 'Создать ' + drafts.length + ' задач на доске' }}
        </button>
        <span v-if="model" class="epic-ai__meta">{{ model }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  configured: { type: Boolean, default: false },
  proposePending: { type: Boolean, default: false },
  applyPending: { type: Boolean, default: false },
  onPropose: { type: Function, default: null },
  onApply: { type: Function, default: null },
});

const open = ref(false);
const instructions = ref('');
const drafts = ref([]);
const model = ref('');
const error = ref('');
const successMessage = ref('');

function updateDraft(index, patch) {
  drafts.value = drafts.value.map((draft, draftIndex) =>
    draftIndex === index ? { ...draft, ...patch } : draft,
  );
}

function removeDraft(index) {
  drafts.value = drafts.value.filter((_, draftIndex) => draftIndex !== index);
}

async function propose() {
  error.value = '';
  successMessage.value = '';
  try {
    const result = await props.onPropose?.(instructions.value.trim() || undefined);
    drafts.value = result?.tasks ?? [];
    model.value = result?.model ?? '';
    open.value = true;
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Не удалось разбить эпик';
  }
}

async function apply() {
  const tasks = drafts.value
    .map((draft) => ({
      title: draft.title.trim(),
      description: draft.description.trim(),
    }))
    .filter((draft) => draft.title.length > 0);

  if (tasks.length === 0) {
    error.value = 'Добавьте хотя бы одну задачу с названием';
    return;
  }

  error.value = '';
  try {
    const result = await props.onApply?.(tasks);
    successMessage.value = 'Создано задач: ' + (result?.createdCount ?? 0);
    drafts.value = [];
    open.value = false;
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Не удалось создать задачи';
  }
}
</script>
