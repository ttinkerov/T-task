<template>
  <div class="tt-landing">
    <div class="tt-landing-glow" aria-hidden="true" />

    <div class="tt-landing__content">
      <header class="tt-nav-wrap">
        <nav class="tt-nav">
          <BrandLogo mark-only class-name="tt-brand-logo--nav" />

          <div class="tt-nav__links">
            <a
              v-for="link in navLinks"
              :key="link.href"
              :href="link.href"
              class="tt-nav__link"
            >
              {{ link.label }}
            </a>
          </div>

          <div class="tt-nav__actions">
            <button
              type="button"
              class="theme-toggle"
              :aria-label="isLight ? 'Включить тёмную тему' : 'Включить светлую тему'"
              :title="isLight ? 'Тёмная тема' : 'Светлая тема'"
              @click="onToggleTheme?.()"
            >
              <span class="theme-toggle__icon" aria-hidden="true">
                <svg v-if="isLight" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    d="M10 2a1 1 0 0 1 1 1v1.5a1 1 0 1 1-2 0V3a1 1 0 0 1 1-1Zm5.657 2.343a1 1 0 0 1 0 1.414L15.192 6.57a1 1 0 1 1-1.414-1.414l1.465-1.465a1 1 0 0 1 1.414 0ZM17 9a1 1 0 0 1 1 1v.5a1 1 0 1 1-2 0V10a1 1 0 0 1 1-1Zm-2.343 5.657a1 1 0 0 1 1.414 0l1.465 1.465a1 1 0 1 1-1.414 1.414L15.192 16.07a1 1 0 0 1 0-1.414ZM10 15.5a1 1 0 0 1 1 1V18a1 1 0 1 1-2 0v-1.5a1 1 0 0 1 1-1ZM4.05 15.192a1 1 0 0 1 1.414 1.414L3.999 17.96a1 1 0 1 1-1.414-1.414l1.465-1.354ZM3 9a1 1 0 0 1 1 1v.5a1 1 0 1 1-2 0V10a1 1 0 0 1 1-1ZM4.464 4.05 5.93 5.515A1 1 0 1 1 4.515 6.93L3.05 5.464A1 1 0 1 1 4.464 4.05ZM10 6.25A3.75 3.75 0 1 0 13.75 10 3.754 3.754 0 0 0 10 6.25Z"
                  />
                </svg>
                <svg v-else viewBox="0 0 20 20" fill="currentColor">
                  <path
                    d="M15.77 12.23a5.75 5.75 0 0 1-8.12-8.12 1 1 0 0 0-1.28-1.28A7.75 7.75 0 1 0 17.05 13.5a1 1 0 0 0-1.28-1.27Z"
                  />
                </svg>
              </span>
            </button>

            <div
              class="tt-lang-toggle"
              role="group"
              :aria-label="locale === 'ru' ? 'Язык' : 'Language'"
            >
              <button
                v-for="option in localeOptions"
                :key="option.value"
                type="button"
                class="tt-lang-toggle__btn"
                :class="{ 'is-active': locale === option.value }"
                :aria-pressed="locale === option.value"
                @click="onSetLocale?.(option.value)"
              >
                {{ option.label }}
              </button>
            </div>

            <a href="/login" class="tt-btn tt-btn--primary tt-nav__cta">
              {{ copy.nav.login }}
            </a>
          </div>
        </nav>
      </header>

      <section class="tt-hero">
        <div class="tt-hero__copy">
          <h1 class="tt-hero__brand">T-task</h1>
          <p class="tt-hero__title">
            {{ copy.hero.titleLine1 }}
            <br />
            {{ copy.hero.titleLine2 }}
          </p>
          <p class="tt-hero__text">{{ copy.hero.text }}</p>
          <div class="tt-hero__actions">
            <a href="/register" class="tt-btn tt-btn--primary tt-btn--lg">
              {{ copy.hero.start }}
              <LandingIcon name="arrow" :size="16" :stroke-width="2" />
            </a>
            <a href="#demo" class="tt-btn tt-btn--secondary tt-btn--lg">
              {{ copy.hero.watch }}
            </a>
          </div>
        </div>

        <div id="demo" class="tt-hero__stage">
          <div class="tt-hero__stage-chrome">
            <span /><span /><span />
          </div>
          <div class="tt-hero__stage-body">
            <div ref="demoHostEl" class="tt-hero__demo-host" v-once />
          </div>
        </div>
      </section>

      <section id="features" class="tt-section">
        <div class="tt-section__head">
          <h2 class="tt-section__title">{{ copy.features.title }}</h2>
        </div>

        <div class="tt-feature-grid">
          <article
            v-for="(feature, index) in copy.features.items"
            :key="feature.title"
            class="tt-feature-card"
          >
            <span class="tt-feature-card__icon" aria-hidden="true">
              <LandingIcon :name="featureIcons[index] || 'kanban'" />
            </span>
            <h3>{{ feature.title }}</h3>
            <p>{{ feature.text }}</p>
          </article>
        </div>
      </section>

      <section id="ai" class="tt-ai-band">
        <div class="tt-ai-band__inner">
          <div class="tt-ai-band__copy">
            <h2 class="tt-ai-band__title">
              {{ copy.ai.titleLine1 }}
              <br />
              {{ copy.ai.titleLine2 }}
            </h2>
            <p class="tt-ai-band__text">{{ copy.ai.text }}</p>
            <a href="/register" class="tt-btn tt-btn--primary tt-btn--lg">
              {{ copy.ai.cta }}
              <LandingIcon name="arrow" :size="16" :stroke-width="2" />
            </a>
          </div>

          <ul class="tt-ai-band__list">
            <li v-for="(item, index) in copy.ai.items" :key="item.title">
              <span class="tt-ai-band__icon" aria-hidden="true">
                <LandingIcon :name="aiIcons[index] || 'message'" />
              </span>
              <div>
                <strong>{{ item.title }}</strong>
                <p>{{ item.text }}</p>
              </div>
            </li>
          </ul>
        </div>
      </section>

      <section id="howto" class="tt-section tt-section--panel">
        <div class="tt-section__head">
          <h2 class="tt-section__title">{{ copy.howto.title }}</h2>
        </div>

        <div class="tt-steps">
          <article
            v-for="step in copy.howto.steps"
            :key="step.num"
            class="tt-step-card"
          >
            <span class="tt-step-card__num">{{ step.num }}</span>
            <h3>{{ step.title }}</h3>
            <p v-if="step.text">{{ step.text }}</p>
          </article>
        </div>
      </section>

      <section id="audiences" class="tt-section">
        <div class="tt-section__head">
          <h2 class="tt-section__title">{{ copy.audiences.title }}</h2>
          <p class="tt-section__subtitle">{{ copy.audiences.subtitle }}</p>
        </div>

        <div class="tt-audience-grid">
          <article
            v-for="(audience, index) in copy.audiences.items"
            :key="audience.title"
            class="tt-audience-card"
          >
            <span class="tt-audience-card__icon" aria-hidden="true">
              <LandingIcon :name="audienceIcons[index] || 'rocket'" :size="20" />
            </span>
            <h3>{{ audience.title }}</h3>
            <p>{{ audience.text }}</p>
            <a href="/register" class="tt-audience-card__link">
              {{ copy.audiences.start }}
              <LandingIcon name="arrow" :size="14" :stroke-width="2" />
            </a>
          </article>
        </div>
      </section>

      <section class="tt-cta-banner">
        <div class="tt-cta-banner__inner">
          <div class="tt-cta-banner__copy">
            <h2>{{ copy.cta.title }}</h2>
            <p>{{ copy.cta.text }}</p>
          </div>
          <a href="/register" class="tt-btn tt-btn--primary tt-btn--lg">
            {{ copy.cta.button }}
            <LandingIcon name="arrow" :size="16" :stroke-width="2" />
          </a>
        </div>
      </section>

      <footer class="tt-footer">
        <div class="tt-footer__inner">
          <div>
            <BrandLogo href="/" />
            <p class="tt-footer__text">{{ copy.footer.text }}</p>
          </div>
          <div class="tt-footer__links">
            <a href="/login">{{ copy.footer.login }}</a>
            <a href="/register">{{ copy.footer.register }}</a>
            <a href="#features">{{ copy.footer.features }}</a>
            <a href="#ai">{{ copy.footer.ai }}</a>
            <a href="#audiences">{{ copy.footer.audiences }}</a>
          </div>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import BrandLogo from './BrandLogo.vue'
import LandingIcon from './LandingIcon.vue'

const props = defineProps({
  copy: { type: Object, required: true },
  locale: { type: String, required: true },
  theme: { type: String, required: true },
  onSetLocale: { type: Function, default: null },
  onToggleTheme: { type: Function, default: null },
  onDemoHostReady: { type: Function, default: null },
})

const featureIcons = [
  'kanban',
  'workflow',
  'clipboard',
  'calendar',
  'repeat',
  'form',
  'chart',
  'timer',
  'sparkles',
  'layers',
]

const audienceIcons = ['rocket', 'building', 'globe']
const aiIcons = ['message', 'sparkles', 'workflow']

const localeOptions = [
  { value: 'ru', label: 'RU' },
  { value: 'en', label: 'EN' },
]

const demoHostEl = ref(null)
const isLight = computed(() => props.theme === 'light')

const navLinks = computed(() => [
  { label: props.copy.nav.features, href: '#features' },
  { label: props.copy.nav.ai, href: '#ai' },
  { label: props.copy.nav.howto, href: '#howto' },
  { label: props.copy.nav.audiences, href: '#audiences' },
])

function notifyDemoHost(el) {
  props.onDemoHostReady?.(el)
}

onMounted(() => {
  notifyDemoHost(demoHostEl.value)
})

watch(demoHostEl, (el) => {
  notifyDemoHost(el)
})

onBeforeUnmount(() => {
  notifyDemoHost(null)
})
</script>
