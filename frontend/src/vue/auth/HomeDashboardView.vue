<template>
  <section class="home-dashboard" aria-labelledby="home-dashboard-title">
    <header class="home-dashboard__header">
      <div>
        <h1 id="home-dashboard-title" class="tt-logo" style="font-size: 1.5rem">
          Добро пожаловать, {{ userName }}
        </h1>
        <p>Что сделать дальше — просрочки, ближайшие дедлайны и недавние задачи.</p>
      </div>
      <div class="home-dashboard__header-actions">
        <a href="/dashboard/my-tasks" class="btn-ghost text-sm">Все мои задачи</a>
        <a href="/dashboard/board" class="btn-primary text-sm">Открыть доску</a>
      </div>
    </header>

    <p v-if="!hasWorkspace" class="home-dashboard__hint">
      Выберите или создайте команду, чтобы увидеть задачи.
    </p>

    <p v-if="hasWorkspace && isLoading" role="status">Загрузка задач...</p>
    <p v-if="hasWorkspace && isError" class="all-tasks__error" role="alert">
      Не удалось загрузить задачи.
      <button type="button" class="board-filters__chip" @click="onRetry?.()">Повторить</button>
    </p>

    <template v-if="hasWorkspace && !isLoading && !isError">
      <ul class="home-dashboard__stats" aria-label="Сводка по вашим задачам">
        <li class="home-dashboard__stat home-dashboard__stat--danger">
          <strong>{{ counts.overdue }}</strong>
          <span>Просрочено</span>
        </li>
        <li class="home-dashboard__stat home-dashboard__stat--warn">
          <strong>{{ counts.dueSoon }}</strong>
          <span>Скоро · {{ dueSoonDays }} дн.</span>
        </li>
        <li class="home-dashboard__stat">
          <strong>{{ counts.assigned }}</strong>
          <span>Назначено</span>
        </li>
        <li class="home-dashboard__stat">
          <strong>{{ counts.open }}</strong>
          <span>Открытых</span>
        </li>
      </ul>

      <div class="home-dashboard__grid my-tasks">
        <MyTasksSection
          v-for="section in sections"
          :key="section.id"
          :id="section.id"
          :title="section.title"
          :hint="section.hint"
          :tasks="section.tasks"
          :count="section.count"
          :tone="section.tone || ''"
          :empty-label="section.emptyLabel || ''"
          :priority-labels="priorityLabels"
          :on-open-task="onOpenTask"
        />
      </div>
    </template>

    <nav class="home-dashboard__links" aria-label="Быстрые ссылки">
      <a v-for="link in quickLinks" :key="link.href" :href="link.href" class="home-dashboard__link">
        {{ link.label }}
      </a>
    </nav>

    <div class="glass-panel space-y-3 rounded-2xl p-5">
      <h2 class="text-sm font-medium text-muted-foreground">Активная команда</h2>
      <WorkspaceSwitcher
        :workspaces="switcherWorkspaces"
        :current-workspace-id="currentWorkspaceId"
        :on-change="onWorkspaceChange"
      />
      <p v-if="currentWorkspaceRole" class="text-sm text-muted-foreground">
        Роль:
        <span class="font-medium text-foreground">{{ currentWorkspaceRole }}</span>
      </p>
      <CreateWorkspaceForm :is-pending="createPending" :on-create="onCreateWorkspace" />
    </div>

    <div class="glass-panel rounded-2xl p-5">
      <h2 class="text-sm font-medium text-muted-foreground">Все команды</h2>
      <ul class="mt-3 space-y-2">
        <li
          v-for="workspace in workspaces"
          :key="workspace.id"
          class="flex items-center justify-between rounded-xl border border-border bg-secondary px-3 py-2"
        >
          <div>
            <p class="font-medium">{{ workspace.name }}</p>
            <p class="text-xs text-muted-foreground">{{ workspace.slug }}</p>
          </div>
          <div class="flex items-center gap-3">
            <span
              class="rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-medium text-foreground"
            >
              {{ workspace.role }}
            </span>
            <a
              :href="workspace.settingsHref"
              class="text-sm text-muted-foreground hover:text-foreground"
            >
              Настройки
            </a>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup>
import MyTasksSection from '../all-tasks/MyTasksSection.vue';
import CreateWorkspaceForm from '../workspaces/CreateWorkspaceForm.vue';
import WorkspaceSwitcher from '../workspaces/WorkspaceSwitcher.vue';

defineProps({
  userName: { type: String, default: '' },
  hasWorkspace: { type: Boolean, default: false },
  isLoading: { type: Boolean, default: false },
  isError: { type: Boolean, default: false },
  dueSoonDays: { type: Number, default: 7 },
  counts: {
    type: Object,
    default: () => ({ overdue: 0, dueSoon: 0, assigned: 0, open: 0 }),
  },
  sections: { type: Array, default: () => [] },
  quickLinks: { type: Array, default: () => [] },
  workspaces: { type: Array, default: () => [] },
  switcherWorkspaces: { type: Array, default: () => [] },
  currentWorkspaceId: { type: String, default: '' },
  currentWorkspaceRole: { type: String, default: '' },
  createPending: { type: Boolean, default: false },
  priorityLabels: { type: Object, default: () => ({}) },
  onOpenTask: { type: Function, default: null },
  onWorkspaceChange: { type: Function, default: null },
  onCreateWorkspace: { type: Function, default: null },
  onRetry: { type: Function, default: null },
});
</script>
