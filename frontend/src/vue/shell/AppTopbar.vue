<template>
  <header class="app-topbar">
    <div class="app-topbar__left">
      <span class="lg:hidden">
        <BrandLogo href="/dashboard" />
      </span>
      <button
        type="button"
        class="app-topbar__search"
        aria-label="Открыть командную палитру"
        @click="onOpenSearch?.()"
      >
        <ShellIcon name="search" :size="14" />
        <span>Поиск и команды</span>
        <kbd>⌘K</kbd>
      </button>
    </div>

    <div class="app-topbar__right">
      <div ref="bellHost" />
      <ThemeToggle :is-light="isLight" :on-toggle="onToggleTheme" />
      <span class="app-topbar__user">{{ userName }}</span>
      <div ref="switcherHost" />
      <a
        :href="settingsHref"
        class="dashboard-header__icon-btn"
        aria-label="Настройки"
        title="Настройки"
      >
        <ShellIcon name="settings" :size="16" />
      </a>
      <button
        type="button"
        class="dashboard-header__icon-btn"
        title="Выйти"
        aria-label="Выйти"
        :disabled="logoutPending"
        @click="onLogout?.()"
      >
        <ShellIcon name="logout" :size="16" />
      </button>
    </div>
  </header>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import BrandLogo from '../marketing/BrandLogo.vue';
import ShellIcon from './ShellIcon.vue';
import ThemeToggle from '../theme/ThemeToggle.vue';

const props = defineProps({
  userName: { type: String, default: '' },
  settingsHref: { type: String, default: '/dashboard' },
  logoutPending: { type: Boolean, default: false },
  isLight: { type: Boolean, default: false },
  onOpenSearch: { type: Function, default: null },
  onToggleTheme: { type: Function, default: null },
  onLogout: { type: Function, default: null },
  onHostsReady: { type: Function, default: null },
});

const bellHost = ref(null);
const switcherHost = ref(null);

function notifyHosts() {
  props.onHostsReady?.({
    bell: bellHost.value,
    switcher: switcherHost.value,
  });
}

onMounted(notifyHosts);
watch([bellHost, switcherHost], notifyHosts);
onBeforeUnmount(() => props.onHostsReady?.({ bell: null, switcher: null }));
</script>
