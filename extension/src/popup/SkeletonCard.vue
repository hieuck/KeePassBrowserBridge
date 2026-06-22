<template>
  <div class="skeleton-card" aria-hidden="true" :data-testid="'skeleton-card'">
    <div class="skeleton-card__avatar skeleton-pulse" />
    <div class="skeleton-card__lines">
      <div class="skeleton-card__line skeleton-pulse skeleton-card__line--title" />
      <div class="skeleton-card__line skeleton-pulse skeleton-card__line--subtitle" />
    </div>
  </div>
</template>

<style scoped>
.skeleton-card { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3) var(--space-4); }
.skeleton-card__avatar { width: 36px; height: 36px; border-radius: var(--radius-md); flex-shrink: 0; }
.skeleton-card__lines { flex: 1; display: flex; flex-direction: column; gap: var(--space-2); }
.skeleton-card__line { height: 12px; border-radius: var(--radius-sm); }
.skeleton-card__line--title { width: 60%; }
.skeleton-card__line--subtitle { width: 40%; }
@keyframes skeletonPulse { 0% { opacity: 0.3; } 50% { opacity: 0.7; } 100% { opacity: 0.3; } }
.skeleton-pulse { background: var(--color-border); animation: skeletonPulse 1.5s ease-in-out infinite; }
</style>
