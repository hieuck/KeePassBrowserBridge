<template>
  <label class="kbb-input-wrapper" :class="{ 'kbb-input-wrapper--error': !!error }">
    <span v-if="label" class="kbb-input-label">{{ label }}</span>
    <span v-if="description" class="kbb-input-description">{{ description }}</span>
    <span class="kbb-input-shell">
      <Icon v-if="leadingIcon" :name="leadingIcon" :size="14" class="kbb-input__leading-icon" />
      <input
        :id="inputId"
        :type="effectiveType"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :autocomplete="autocomplete"
        :maxlength="maxlength"
        :min="min"
        :max="max"
        :aria-invalid="!!error"
        :aria-describedby="error ? errorId : (description ? descriptionId : undefined)"
        :data-testid="`input-${slugifiedLabel}`"
        class="kbb-input"
        @input="onInput"
        @blur="$emit('blur')"
        @focus="$emit('focus')"
      />
      <button
        v-if="type === 'password' && showToggle"
        type="button"
        class="kbb-input__trailing"
        :aria-label="visible ? 'Hide password' : 'Show password'"
        @click="visible = !visible"
      >
        <Icon :name="visible ? 'eye-off' : 'eye'" :size="14" />
      </button>
      <button
        v-else-if="trailingIcon"
        type="button"
        class="kbb-input__trailing"
        :aria-label="trailingAriaLabel || 'Toggle'"
        @click="$emit('trailing-click')"
      >
        <Icon :name="trailingIcon" :size="14" />
      </button>
    </span>
    <span v-if="error" :id="errorId" class="kbb-input-error" role="alert">{{ error }}</span>
    <span v-else-if="description" :id="descriptionId" class="kbb-input-helper">{{ description }}</span>
  </label>
</template>

<script setup>
import { computed, ref, useId } from 'vue';
import Icon from './Icon.vue';

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  label: { type: String, default: '' },
  description: { type: String, default: '' },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  error: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  readonly: { type: Boolean, default: false },
  required: { type: Boolean, default: false },
  autocomplete: { type: String, default: '' },
  maxlength: { type: [String, Number], default: undefined },
  min: { type: [String, Number], default: undefined },
  max: { type: [String, Number], default: undefined },
  leadingIcon: { type: String, default: '' },
  trailingIcon: { type: String, default: '' },
  trailingAriaLabel: { type: String, default: '' },
  showToggle: { type: Boolean, default: false },
});

const emit = defineEmits(['update:modelValue', 'blur', 'focus', 'trailing-click']);

const visible = ref(false);
const effectiveType = computed(() => {
  if (props.type === 'password' && visible.value) return 'text';
  return props.type;
});

const generatedId = useId();
const inputId = computed(() => `kbb-input-${generatedId}`);
const slugifiedLabel = computed(() => String(props.label || '').toLowerCase().replace(/\s+/g, '-') || 'input');
const errorId = computed(() => `${inputId.value}-error`);
const descriptionId = computed(() => `${inputId.value}-description`);

function onInput(event) {
  emit('update:modelValue', event.target.value);
}
</script>

<style scoped>
.kbb-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
.kbb-input-label {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text);
}
.kbb-input-description {
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
}
.kbb-input-shell {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  height: 36px;
  padding: 0 var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}
.kbb-input-shell:focus-within {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px var(--color-accent-subtle);
}
.kbb-input-wrapper--error .kbb-input-shell {
  border-color: var(--color-danger);
}
.kbb-input {
  flex: 1;
  border: none;
  background: transparent;
  font: inherit;
  font-size: var(--text-base);
  color: var(--color-text);
  outline: none;
  min-width: 0;
}
.kbb-input::placeholder {
  color: var(--color-text-muted);
}
.kbb-input:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
.kbb-input__leading-icon,
.kbb-input__trailing {
  color: var(--color-text-secondary);
  display: inline-flex;
}
.kbb-input__trailing {
  background: transparent;
  border: none;
  padding: var(--space-1);
  cursor: pointer;
  border-radius: var(--radius-sm);
}
.kbb-input__trailing:hover {
  background: var(--color-bg);
}
.kbb-input-error {
  font-size: var(--text-xs);
  color: var(--color-danger);
}
.kbb-input-helper {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}
</style>
