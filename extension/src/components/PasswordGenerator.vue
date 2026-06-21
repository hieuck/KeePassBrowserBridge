<template>
  <div class="password-generator" :class="{ hidden: !visible }">
    <div class="gen-header">
      <span>🔑 Password Generator</span>
      <button class="gen-close" type="button" @click="$emit('close')">&times;</button>
    </div>
    <div class="gen-password-row">
      <input class="generated-password" type="text" readonly spellcheck="false" :value="password">
      <button class="gen-refresh-btn" title="Generate new" @click="$emit('refresh')">↻</button>
    </div>
    <div class="gen-options">
      <div class="gen-option">
        <label>Length</label>
        <input class="gen-length" type="range" min="8" max="64" :value="length" @input="$emit('update:length', Number($event.target.value))">
        <span class="gen-length-value">{{ length }}</span>
      </div>
      <div class="gen-option">
        <label><input class="gen-uppercase" type="checkbox" :checked="useUpper" @change="$emit('update:useUpper', $event.target.checked)"> A-Z</label>
      </div>
      <div class="gen-option">
        <label><input class="gen-lowercase" type="checkbox" :checked="useLower" @change="$emit('update:useLower', $event.target.checked)"> a-z</label>
      </div>
      <div class="gen-option">
        <label><input class="gen-digits" type="checkbox" :checked="useDigits" @change="$emit('update:useDigits', $event.target.checked)"> 0-9</label>
      </div>
      <div class="gen-option">
        <label><input class="gen-symbols" type="checkbox" :checked="useSymbols" @change="$emit('update:useSymbols', $event.target.checked)"> !@#$%</label>
      </div>
    </div>
    <div class="gen-actions">
      <button class="gen-copy-btn btn-copy" type="button" @click="$emit('copy')">📋 Copy</button>
      <button class="gen-fill-btn btn-autofill" type="button" @click="$emit('fill-password')">⬇ Fill & Close</button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  visible: { type: Boolean, default: false },
  password: { type: String, default: '' },
  length: { type: Number, default: 20 },
  useUpper: { type: Boolean, default: true },
  useLower: { type: Boolean, default: true },
  useDigits: { type: Boolean, default: true },
  useSymbols: { type: Boolean, default: false }
});

defineEmits(['close', 'refresh', 'copy', 'fill-password', 'update:length', 'update:useUpper', 'update:useLower', 'update:useDigits', 'update:useSymbols']);
</script>
