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
            </li>
        </ul>

        <p v-if="!isLoading && tags.length === 0" class="tags-page__empty">
            Пока нет тегов - создайте первый выше
        </p>
    </div>
</template>

<script setup>

defineProps({
    tags: { type: Array, required: true },
    isLoading: { type: Boolean, default: false}
})

</script>