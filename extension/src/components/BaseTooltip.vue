<template>
  <div class="kbb-tooltip-wrapper" @mouseenter="show" @mouseleave="hide" @focusin="show" @focusout="hide" :data-testid="testId">
    <slot />
    <transition name="kbb-tooltip">
      <div v-if="visible" class="kbb-tooltip" role="tooltip" :style="positionStyle">
        {{ text }}
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  text: { type: String, required: true },
  position: { type: String, default: 'top' },
  delay: { type: Number, default: 200 },
});

const testId = computed(() => 'tooltip');
const visible = ref(false);
let timer = null;

const positionStyle = computed(() => ({
  [props.position]: '100%',
  transform: props.position === 'top' ? 'translateY(-4px)' : props.position === 'bottom' ? 'translateY(4px)' : 'translateX(0)',
}));

function show() {
  clearTimeout(timer);
  timer = setTimeout(() => { visible.value = true; }, props.delay);
}
function hide() {
  clearTimeout(timer);
  visible.value = false;
}
</script>

<style scoped>
.kbb-tooltip-wrapper { display: inline-flex; position: relative; }
.kbb-tooltip { position: absolute; z-index: var(--z-toast, 3000); padding: 4px 8px; background: var(--color-text); color: var(--color-bg); font-size: var(--text-xs); border-radius: var(--radius-sm); white-space: nowrap; pointer-events: none; left: 50%; transform: translateX(-50%); }
.kbb-tooltip-enter-active, .kbb-tooltip-leave-active { transition: opacity var(--transition-fast); }
.kbb-tooltip-enter-from, .kbb-tooltip-leave-to { opacity: 0; }
</style>
