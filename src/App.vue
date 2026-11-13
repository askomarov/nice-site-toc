<script setup lang="ts">
import { ref } from 'vue'
import { VueLenis } from 'lenis/vue'
import NavPools from '@/components/NavPools.vue'
import { sections } from '@/sections'
import { useFlyingNav } from '@/composables/useFlyingNav'

const root = ref<HTMLElement | null>(null)
useFlyingNav(root)

const lenisOptions = {
  anchors: true,
  syncTouch: true,
}

function letters(title: string): string[] {
  return [...title]
}
</script>

<template>
  <VueLenis root :options="lenisOptions" />

  <div ref="root" class="page">
    <NavPools />

    <nav class="rail" aria-label="Sections">
      <a v-for="(section, sectionIndex) in sections" :key="section.id" :href="`#${section.id}`"
        :aria-label="section.title" :data-nav="section.id" class="nav-link">
        <span v-for="(letter, letterIndex) in letters(section.title)" :key="`${section.id}-${letterIndex}`"
          class="letter" :style="{ zIndex: sectionIndex + 1 }">{{ letter === ' ' ? '\u00A0' : letter }}</span>
      </a>
    </nav>

    <main>
      <section v-for="section in sections" :id="section.id" :key="section.id" :data-section="section.id" class="panel">
        <h2>{{ section.title }}</h2>
        <p>{{ section.body }}</p>
      </section>
    </main>
    <!-- <footer>
      <p>Footer</p>
    </footer> -->
  </div>
</template>

<style>
@font-face {
  font-family: 'Bebas Neue';
  src: url('/bebas-neue-v9-latin-regular.woff') format('woff');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

body {
  --bg: #f3f1ee;
  margin: 0;
  background: var(--bg);
  color: #161513;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
}
</style>

<style scoped>
.page {
  background: var(--bg);
}

.page.is-ready .letter {
  visibility: visible;
}

.rail {
  position: fixed;
  inset: 0;
  z-index: 2;
  pointer-events: none;
}

.nav-link {
  pointer-events: none;
}

.nav-link:focus {
  outline: none;
}

.nav-link:focus-visible .letter {
  text-decoration: underline;
  text-underline-offset: 0.12em;
}

.nav-link.is-active .letter,
.nav-link:hover .letter,
.nav-link:focus-visible .letter {
  color: #161513;
}

.letter {
  position: fixed;
  top: 0;
  left: 0;
  display: block;
  visibility: hidden;
  margin: 0;
  padding: 0;
  color: color-mix(in srgb, #161513 52%, transparent);
  font-family: 'Bebas Neue', sans-serif;
  font-size: 36px;
  font-weight: 400;
  line-height: 1;
  letter-spacing: 0.035em;
  white-space: pre;
  transform-origin: center center;
  pointer-events: auto;
  cursor: pointer;
  user-select: none;
  will-change: transform;
  transition: color 0.22s ease;
}

@media (prefers-reduced-motion: reduce) {
  .letter {
    transition: none;
  }
}

.panel {
  min-height: 90svh;
  box-sizing: border-box;
  border-top: 1px solid rgba(22, 21, 19, 0.14);
  padding: 28px 32px 48px;

  &:nth-child(even) {
    background-color: #2b2b2a;
    color: #f3f1ee;
  }
}

main {
  /* padding-bottom: 35svh; */
}

.panel p {
  max-width: min(32rem, calc(100% - 12rem));
  margin: 26vh 0 0;
  font-size: 1.0625rem;
  font-weight: 400;
  line-height: 1.5;
  /* color: #3c3a36; */
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
