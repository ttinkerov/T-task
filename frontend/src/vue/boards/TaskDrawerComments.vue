<template>
  <div class="task-drawer__comments">
    <h3 class="task-drawer__comments-title task-drawer__section-title">
      Комментарии
      <FieldHint text="Обсуждение по задаче. Можно упоминать участников через @." />
    </h3>

    <p v-if="loading" class="text-sm text-muted-foreground">Загрузка...</p>
    <p v-else-if="comments.length === 0" class="text-sm text-muted-foreground">
      Пока нет комментариев
    </p>
    <ul v-else class="task-drawer__comments-list">
      <li v-for="comment in comments" :key="comment.id" class="task-drawer__comment">
        <div class="task-drawer__comment-head">
          <span class="task-drawer__comment-author">{{ comment.authorName }}</span>
          <span class="task-drawer__comment-date">{{ comment.dateLabel }}</span>
          <button
            v-if="comment.canDelete"
            type="button"
            class="task-drawer__comment-delete"
            aria-label="Удалить комментарий"
            @click="onDelete?.(comment.id)"
          >
            ×
          </button>
        </div>
        <p class="task-drawer__comment-body">
          <MentionText :tokens="comment.tokens" />
        </p>
      </li>
    </ul>

    <form class="task-drawer__comment-form" @submit.prevent="submit">
      <MentionTextarea
        id="task-comment-input"
        :value="commentBody"
        :members="members"
        class-name="glass-input task-drawer__textarea"
        :rows="2"
        :max-length="2000"
        placeholder="Комментарий… Введите @ для упоминания"
        aria-label="Новый комментарий"
        :listbox-id="listboxId"
        :find-mention-trigger="findMentionTrigger"
        :find-wiki-link-trigger="findWikiLinkTrigger"
        :insert-mention="insertMention"
        :insert-wiki-link="insertWikiLink"
        :on-change="onCommentBodyChange"
      />
      <button type="submit" class="btn-ghost" :disabled="!canSubmit || submitPending">
        Отправить
      </button>
    </form>
  </div>
</template>

<script setup>
import FieldHint from './FieldHint.vue';
import MentionText from '../mentions/MentionText.vue';
import MentionTextarea from '../mentions/MentionTextarea.vue';

const props = defineProps({
  loading: { type: Boolean, default: false },
  comments: { type: Array, default: () => [] },
  members: { type: Array, default: () => [] },
  commentBody: { type: String, default: '' },
  canSubmit: { type: Boolean, default: false },
  submitPending: { type: Boolean, default: false },
  listboxId: { type: String, required: true },
  findMentionTrigger: { type: Function, required: true },
  findWikiLinkTrigger: { type: Function, required: true },
  insertMention: { type: Function, required: true },
  insertWikiLink: { type: Function, required: true },
  onCommentBodyChange: { type: Function, default: null },
  onSubmit: { type: Function, default: null },
  onDelete: { type: Function, default: null },
});

function submit() {
  props.onSubmit?.();
}
</script>
