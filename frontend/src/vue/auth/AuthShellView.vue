<template>
  <div class="tt-landing__content tt-auth">
    <header class="tt-nav-wrap">
      <nav class="tt-nav tt-auth__nav">
        <BrandLogo />
        <div class="tt-nav__actions">
          <ThemeToggle :is-light="isLight" :on-toggle="onToggleTheme" />
          <a href="/register" class="tt-btn tt-btn--primary tt-btn--pill tt-nav__cta">
            Регистрация
          </a>
        </div>
      </nav>
    </header>

    <section class="tt-auth__main">
      <div class="tt-auth__card">
        <div class="tt-auth__head">
          <h1 class="tt-auth__title">{{ title }}</h1>
          <p class="tt-auth__subtitle">{{ subtitle }}</p>
        </div>
        <div ref="formHost" class="tt-auth__form-host" />
      </div>
      <div class="tt-auth__footer">
        {{ footerPrefix }}
        <a :href="footerHref">{{ footerLinkLabel }}</a>
      </div>
    </section>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import BrandLogo from '../marketing/BrandLogo.vue';
import ThemeToggle from '../theme/ThemeToggle.vue';

const props = defineProps({
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  footerPrefix: { type: String, default: '' },
  footerHref: { type: String, default: '/' },
  footerLinkLabel: { type: String, default: '' },
  isLight: { type: Boolean, default: false },
  onToggleTheme: { type: Function, default: null },
  onFormHostReady: { type: Function, default: null },
});

const formHost = ref(null);

function notifyHost(el) {
  props.onFormHostReady?.(el);
}

onMounted(() => notifyHost(formHost.value));
watch(formHost, (el) => notifyHost(el));
onBeforeUnmount(() => notifyHost(null));
</script>
