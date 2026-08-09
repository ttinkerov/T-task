<template>
  <div class="task-doc-editor" role="group" aria-label="Описание задачи">
    <p class="task-doc-editor__hint">
      Блоки: заголовки, списки, выноски. @ — коллега, [[ — задача. Enter — новый блок.
    </p>
    <div class="task-doc-editor__blocks">
      <div
        v-for="(block, index) in blocks"
        :key="block.id"
        class="task-doc-block"
        :class="'task-doc-block--' + block.type"
      >
        <div class="task-doc-block__toolbar">
          <select
            class="glass-input task-doc-block__type"
            :value="block.type"
            aria-label="Тип блока"
            @change="changeType(index, $event.target.value)"
          >
            <option v-for="option in typeOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
          <button
            type="button"
            class="task-doc-block__icon-btn"
            aria-label="Добавить блок"
            @click="addBlockAfter(index)"
          >
            +
          </button>
          <button
            type="button"
            class="task-doc-block__icon-btn"
            aria-label="Удалить блок"
            @click="removeBlock(index)"
          >
            ×
          </button>
        </div>

        <div
          v-if="block.type === 'bullet' || block.type === 'numbered'"
          class="task-doc-block__list-row"
        >
          <span class="task-doc-block__marker" aria-hidden="true">
            {{ block.type === 'bullet' ? '•' : numberedMarker(index) }}
          </span>
          <MentionTextarea
            :value="block.text"
            :members="members"
            :wiki-link-tasks="wikiLinkTasks"
            :exclude-wiki-task-id="excludeWikiTaskId"
            class-name="glass-input task-doc-block__input"
            :rows="1"
            :max-length="2000"
            placeholder="Пункт списка…"
            :listbox-id="'desc-' + block.id"
            :find-mention-trigger="findMentionTrigger"
            :find-wiki-link-trigger="findWikiLinkTrigger"
            :insert-mention="insertMention"
            :insert-wiki-link="insertWikiLink"
            :on-change="(text) => updateBlock(index, { text })"
            :on-key-down-extra="(event) => onListEnter(event, index, block.type)"
          />
        </div>

        <div v-else-if="block.type === 'toggle'" class="task-doc-block__toggle">
          <MentionTextarea
            :value="block.text"
            :members="members"
            :wiki-link-tasks="wikiLinkTasks"
            :exclude-wiki-task-id="excludeWikiTaskId"
            class-name="glass-input task-doc-block__input task-doc-block__input--toggle-title"
            :rows="1"
            :max-length="2000"
            placeholder="Заголовок toggle…"
            :listbox-id="'desc-' + block.id + '-title'"
            :find-mention-trigger="findMentionTrigger"
            :find-wiki-link-trigger="findWikiLinkTrigger"
            :insert-mention="insertMention"
            :insert-wiki-link="insertWikiLink"
            :on-change="(text) => updateBlock(index, { text })"
          />
          <MentionTextarea
            :value="block.body || ''"
            :members="members"
            :wiki-link-tasks="wikiLinkTasks"
            :exclude-wiki-task-id="excludeWikiTaskId"
            class-name="glass-input task-doc-block__input"
            :rows="2"
            :max-length="2000"
            placeholder="Скрытое содержимое…"
            :listbox-id="'desc-' + block.id + '-body'"
            :find-mention-trigger="findMentionTrigger"
            :find-wiki-link-trigger="findWikiLinkTrigger"
            :insert-mention="insertMention"
            :insert-wiki-link="insertWikiLink"
            :on-change="(body) => updateBlock(index, { body })"
          />
        </div>

        <MentionTextarea
          v-else
          :value="block.text"
          :members="members"
          :wiki-link-tasks="wikiLinkTasks"
          :exclude-wiki-task-id="excludeWikiTaskId"
          :class-name="
            'glass-input task-doc-block__input task-doc-block__input--' + block.type
          "
          :rows="block.type.startsWith('heading') ? 1 : 2"
          :max-length="2000"
          :placeholder="placeholderFor(block.type)"
          :listbox-id="'desc-' + block.id"
          :find-mention-trigger="findMentionTrigger"
          :find-wiki-link-trigger="findWikiLinkTrigger"
          :insert-mention="insertMention"
          :insert-wiki-link="insertWikiLink"
          :on-change="(text) => updateBlock(index, { text })"
          :on-key-down-extra="(event) => onParagraphEnter(event, index, block.type)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import MentionTextarea from '../mentions/MentionTextarea.vue'

const props = defineProps({
  value: { type: Object, required: true },
  members: { type: Array, default: () => [] },
  wikiLinkTasks: { type: Array, default: () => [] },
  excludeWikiTaskId: { type: String, default: '' },
  typeOptions: { type: Array, default: () => [] },
  findMentionTrigger: { type: Function, required: true },
  findWikiLinkTrigger: { type: Function, required: true },
  insertMention: { type: Function, required: true },
  insertWikiLink: { type: Function, required: true },
  onChange: { type: Function, default: null },
})

const fallbackBlock = { id: 'empty', type: 'paragraph', text: '' }

const blocks = computed(() =>
  props.value?.blocks?.length > 0 ? props.value.blocks : [fallbackBlock],
)

function createBlockId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 16)
  }
  return `b${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

function emitBlocks(nextBlocks) {
  props.onChange?.({
    version: 1,
    blocks: nextBlocks.length > 0 ? nextBlocks : [{ id: createBlockId(), type: 'paragraph', text: '' }],
  })
}

function updateBlock(index, patch) {
  emitBlocks(
    blocks.value.map((block, i) => (i === index ? { ...block, ...patch } : block)),
  )
}

function addBlockAfter(index, type = 'paragraph') {
  const next = blocks.value.slice()
  next.splice(index + 1, 0, {
    id: createBlockId(),
    type,
    text: '',
    ...(type === 'toggle' ? { body: '' } : {}),
  })
  emitBlocks(next)
}

function removeBlock(index) {
  if (blocks.value.length <= 1) {
    emitBlocks([{ id: createBlockId(), type: 'paragraph', text: '' }])
    return
  }
  emitBlocks(blocks.value.filter((_, i) => i !== index))
}

function changeType(index, type) {
  const block = blocks.value[index]
  if (!block) return
  updateBlock(index, {
    type,
    body: type === 'toggle' ? block.body || '' : undefined,
  })
}

function numberedMarker(index) {
  return `${blocks.value.slice(0, index + 1).filter((item) => item.type === 'numbered').length}.`
}

function placeholderFor(type) {
  if (type === 'callout') return 'Выноска…'
  if (type === 'heading1') return 'Заголовок'
  if (type === 'heading2') return 'Подзаголовок'
  return 'Текст…'
}

function onListEnter(event, index, type) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    addBlockAfter(index, type)
  }
}

function onParagraphEnter(event, index, type) {
  if (event.key === 'Enter' && !event.shiftKey && type === 'paragraph') {
    event.preventDefault()
    addBlockAfter(index)
  }
}
</script>
