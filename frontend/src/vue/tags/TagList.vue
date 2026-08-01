<template>
    <div>
        <p v-if="isLoading" role="status">Загрузка тегов...</p>

        <ul v-else class="tags-page__list" role="list">
            <li v-for="tag in tags" :key="tag.id">
                <span
                class="tag-chip"
                :style="{ background: tag.color + '22', color: tag.color }"
                >
                {{ tag.name }}
                </span>

                <div class="tags-page__actions">
                    <button type="button" @click="onRenameClick(tag)">
                        Переименовать
                    </button>
                    <button type="button" @click="onDeleteClick(tag)">
                        Удалить
                    </button>
                </div>
            </li>
        </ul>

        <p v-if="!isLoading && tags.length === 0" class="tags-page__empty">
            Пока нет тегов - создайте первый выше
        </p>
    </div>
</template>

<script setup>

const props = defineProps({
    tags: { type: Array, required: true },
    isLoading: { type: Boolean, default: false },
})

const emit = defineEmits(['rename', 'delete'])

function onRenameClick(tag) {
    const next = window.prompt('Новое название', tag.name)
    if (next && next.trim() && next.trim() !== tag.name) {
        emit('rename', { tagId: tag.id, name: next.trim() })
    }
}

function onDeleteClick(tag) {
    if (window.confirm('Удалить тег «' + tag.name + '»?')) {
        emit('delete', tag.id)
    }
}

</script>