<template>
  <div
    v-if="visible"
    class="toast"
    :class="['toast-' + type, { 'toast-visible': show }]"
    role="alert"
  >{{ message }}</div>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue';

const props = defineProps({
  message: { type: String, default: '' },
  type: { type: String, default: 'success' }
});

const visible = ref(false);
const show = ref(false);
let hideTimer = null;
let removeTimer = null;

watch(() => props.message, (val) => {
  if (!val) return;
  visible.value = true;
  clearTimeout(hideTimer);
  clearTimeout(removeTimer);
  setTimeout(() => { show.value = true; }, 20);
  hideTimer = setTimeout(() => {
    show.value = false;
    removeTimer = setTimeout(() => { visible.value = false; }, 200);
  }, 2500);
});

onUnmounted(() => {
  clearTimeout(hideTimer);
  clearTimeout(removeTimer);
});
</script>
