<template>
  <div class="mention-editor">
    <textarea
      :id="id || undefined"
      ref="textareaRef"
      :value="value"
      :class="className || undefined"
      :rows="rows || undefined"
      :maxlength="maxLength || undefined"
      :placeholder="placeholder || undefined"
      :required="required || undefined"
      :autofocus="autoFocus || undefined"
      :aria-label="ariaLabel || undefined"
      aria-autocomplete="list"
      :aria-controls="suggestionsOpen ? listboxId : undefined"
      :aria-expanded="suggestionsOpen"
      :aria-activedescendant="activeOptionId || undefined"
      @input="onInput"
      @click="onCursor"
      @blur="closeSuggestions"
      @keydown="onKeyDown"
    />

    <ul
      v-if="suggestionsOpen && suggestionKind === 'mention'"
      :id="listboxId"
      class="mention-editor__suggestions"
      role="listbox"
    >
      <li
        v-for="(member, index) in mentionSuggestions"
        :id="listboxId + '-option-' + member.userId"
        :key="member.userId"
        role="option"
        :aria-selected="index === activeIndex"
      >
        <button
          type="button"
          :class="{ 'mention-editor__option--active': index === activeIndex }"
          @mousedown.prevent
          @click="selectMention(member)"
        >
          <span>{{ member.name }}</span>
          <small>{{ member.email }}</small>
        </button>
      </li>
    </ul>

    <ul
      v-else-if="suggestionsOpen && suggestionKind === 'wiki'"
      :id="listboxId"
      class="mention-editor__suggestions"
      role="listbox"
    >
      <li
        v-for="(task, index) in wikiSuggestions"
        :id="listboxId + '-wiki-' + task.id"
        :key="task.id"
        role="option"
        :aria-selected="index === activeIndex"
      >
        <button
          type="button"
          :class="{ 'mention-editor__option--active': index === activeIndex }"
          @mousedown.prevent
          @click="selectWiki(task)"
        >
          <span>{{ task.title }}</span>
          <small v-if="task.columnName">{{ task.columnName }}</small>
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue'

const props = defineProps({
  value: { type: String, default: '' },
  members: { type: Array, default: () => [] },
  wikiLinkTasks: { type: Array, default: () => [] },
  excludeWikiTaskId: { type: String, default: '' },
  className: { type: String, default: '' },
  id: { type: String, default: '' },
  rows: { type: Number, default: null },
  maxLength: { type: Number, default: null },
  placeholder: { type: String, default: '' },
  required: { type: Boolean, default: false },
  autoFocus: { type: Boolean, default: false },
  ariaLabel: { type: String, default: '' },
  listboxId: { type: String, required: true },
  findMentionTrigger: { type: Function, required: true },
  findWikiLinkTrigger: { type: Function, required: true },
  insertMention: { type: Function, required: true },
  insertWikiLink: { type: Function, required: true },
  onChange: { type: Function, default: null },
  onKeyDownExtra: { type: Function, default: null },
})

const textareaRef = ref(null)
const active = ref(null)
const activeIndex = ref(0)

const mentionSuggestions = computed(() => {
  if (!active.value || active.value.kind !== 'mention') return []
  const query = active.value.trigger.query.toLocaleLowerCase('ru-RU')
  return props.members
    .filter((member) => {
      if (!query) return true
      return `${member.name} ${member.email}`.toLocaleLowerCase('ru-RU').includes(query)
    })
    .slice(0, 8)
})

const wikiSuggestions = computed(() => {
  if (!active.value || active.value.kind !== 'wiki') return []
  const query = active.value.trigger.query.toLocaleLowerCase('ru-RU')
  return props.wikiLinkTasks
    .filter((task) => task.id !== props.excludeWikiTaskId)
    .filter((task) => {
      if (!query) return true
      return task.title.toLocaleLowerCase('ru-RU').includes(query)
    })
    .slice(0, 8)
})

const suggestionKind = computed(() => active.value?.kind || null)
const suggestionsOpen = computed(
  () =>
    (suggestionKind.value === 'mention' && mentionSuggestions.value.length > 0) ||
    (suggestionKind.value === 'wiki' && wikiSuggestions.value.length > 0),
)

const suggestionCount = computed(() =>
  suggestionKind.value === 'wiki'
    ? wikiSuggestions.value.length
    : mentionSuggestions.value.length,
)

const activeOptionId = computed(() => {
  if (suggestionKind.value === 'wiki' && wikiSuggestions.value[activeIndex.value]) {
    return props.listboxId + '-wiki-' + wikiSuggestions.value[activeIndex.value].id
  }
  if (suggestionKind.value === 'mention' && mentionSuggestions.value[activeIndex.value]) {
    return props.listboxId + '-option-' + mentionSuggestions.value[activeIndex.value].userId
  }
  return ''
})

function refreshTrigger(text, cursor) {
  const wiki = props.findWikiLinkTrigger(text, cursor)
  if (wiki) {
    active.value = { kind: 'wiki', trigger: wiki }
    activeIndex.value = 0
    return
  }
  const mention = props.findMentionTrigger(text, cursor)
  if (mention) {
    active.value = { kind: 'mention', trigger: mention }
    activeIndex.value = 0
    return
  }
  active.value = null
  activeIndex.value = 0
}

function applyResult(result) {
  props.onChange?.(result.text)
  active.value = null
  nextTick(() => {
    const el = textareaRef.value
    if (!el) return
    el.focus()
    el.setSelectionRange(result.cursor, result.cursor)
  })
}

function selectMention(member) {
  if (!active.value || active.value.kind !== 'mention') return
  applyResult(
    props.insertMention(props.value, active.value.trigger, {
      id: member.userId,
      name: member.name,
    }),
  )
}

function selectWiki(task) {
  if (!active.value || active.value.kind !== 'wiki') return
  applyResult(props.insertWikiLink(props.value, active.value.trigger, task))
}

function onInput(event) {
  const next = event.target.value
  props.onChange?.(next)
  refreshTrigger(next, event.target.selectionStart)
}

function onCursor(event) {
  refreshTrigger(event.target.value, event.target.selectionStart)
}

function closeSuggestions() {
  active.value = null
}

function onKeyDown(event) {
  if (active.value && suggestionCount.value > 0) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      activeIndex.value = (activeIndex.value + 1) % suggestionCount.value
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      activeIndex.value =
        (activeIndex.value - 1 + suggestionCount.value) % suggestionCount.value
      return
    }
    if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault()
      if (active.value.kind === 'wiki') {
        selectWiki(wikiSuggestions.value[activeIndex.value])
      } else {
        selectMention(mentionSuggestions.value[activeIndex.value])
      }
      return
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      active.value = null
      return
    }
  }
  props.onKeyDownExtra?.(event)
}
</script>
