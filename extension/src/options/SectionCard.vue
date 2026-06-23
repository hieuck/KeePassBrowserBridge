<template>
  <section class="section-card">
    <header v-if="title || $slots.header" class="section-card__header">
      <slot name="header">
        <h2 class="section-card__title">{{ title }}</h2>
        <p v-if="description" class="section-card__description">{{ description }}</p>
      </slot>
    </header>
    <div class="section-card__body">
      <slot />
    </div>
  </section>
</template>

<script setup>
defineProps({
  title: { type: String, default: '' },
  description: { type: String, default: '' },
});
</script>

<style scoped>
.section-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); margin-bottom: var(--space-4); box-shadow: var(--shadow-sm); }
.section-card__header { padding: var(--space-4); border-bottom: 1px solid var(--color-border); }
.section-card__title { font-size: var(--text-h3); font-weight: 600; margin: 0 0 var(--space-1); }
.section-card__description { font-size: var(--text-sm); color: var(--color-text-secondary); margin: 0; }
.section-card__body { padding: var(--space-4); }
.section-card__body > :first-child { margin-top: 0; }
.section-card__body > :last-child { margin-bottom: 0; }
</style>
