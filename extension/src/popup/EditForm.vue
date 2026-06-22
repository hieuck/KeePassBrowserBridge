<template>
  <form class="form" @submit.prevent="onSave">
    <header class="form__header">
      <h2>Editing {{ entry.Title }}</h2>
      <button type="button" class="form__close" aria-label="Close form" @click="onCancel">
        <Icon name="close" :size="16" />
      </button>
    </header>
    <div class="form__body">
      <BaseInput v-model="form.Title" label="Title" required :error="errors.Title" @input="errors.Title = ''" />
      <BaseInput v-model="form.Url" label="URL" type="url" :error="errors.Url" @input="errors.Url = ''" />
      <BaseInput v-model="form.UserName" label="Username" />
      <BaseInput v-model="form.Password" label="Password" type="password" show-toggle />
      <div class="form__password-actions">
        <button type="button" class="form__generate-btn" @click="showGenerator = !showGenerator">
          <Icon name="key" :size="14" /> {{ showGenerator ? 'Hide' : 'Generate' }} strong password
        </button>
      </div>
      <PasswordGenerator
        v-if="showGenerator"
        :visible="showGenerator"
        :password="generatedPassword"
        @fill-password="useGeneratedPassword"
        @close="showGenerator = false"
        @refresh="refreshPassword"
        @copy="copyPassword"
      />
      <BaseInput v-model="form.Group" label="Folder" />
      <div class="form__custom">
        <div class="form__custom-header">
          <span>Custom fields</span>
          <button type="button" class="form__add-custom" @click="addCustomField">
            <Icon name="plus" :size="14" /> Add field
          </button>
        </div>
        <div v-for="(field, idx) in form.CustomFields" :key="idx" class="form__custom-row">
          <BaseInput v-model="field.Name" placeholder="Name" />
          <BaseInput v-model="field.Value" placeholder="Value" type="password" show-toggle />
          <button type="button" class="form__remove-custom" aria-label="Remove field" @click="removeCustomField(idx)">
            <Icon name="trash" :size="14" />
          </button>
        </div>
      </div>
    </div>
    <footer class="form__footer">
      <span v-if="dirty" class="form__dirty-dot" title="Unsaved changes">&#9679;</span>
      <BaseButton variant="ghost" @click="onCancel">Cancel</BaseButton>
      <BaseButton variant="primary" type="submit" :disabled="!canSave">Save changes</BaseButton>
    </footer>
  </form>
</template>

<script setup>
import { reactive, computed, onMounted, onUnmounted } from 'vue';
import Icon from '../components/Icon.vue';
import BaseInput from '../components/BaseInput.vue';
import BaseButton from '../components/BaseButton.vue';
import PasswordGenerator from '../components/PasswordGenerator.vue';
import { isValidUrl, isNonEmpty } from '../../shared/validators.js';

const props = defineProps({ entry: { type: Object, required: true } });
const emit = defineEmits(['save', 'cancel']);

const original = {
  Title: props.entry.Title || '',
  Url: props.entry.Url || '',
  UserName: props.entry.UserName || '',
  Password: props.entry.Password || '',
  Group: props.entry.Group || '',
  CustomFields: JSON.parse(JSON.stringify(props.entry.CustomFields || [])),
};

const form = reactive({
  Title: original.Title,
  Url: original.Url,
  UserName: original.UserName,
  Password: original.Password,
  Group: original.Group,
  CustomFields: JSON.parse(JSON.stringify(props.entry.CustomFields || [])),
});

const errors = reactive({ Title: '', Url: '' });
const showGenerator = ref(false);
const generatedPassword = ref('');

const isDirty = computed(() => {
  if (form.Title !== original.Title) return true;
  if (form.Url !== original.Url) return true;
  if (form.UserName !== original.UserName) return true;
  if (form.Password !== original.Password) return true;
  if (form.Group !== original.Group) return true;
  const origLen = original.CustomFields.length;
  const formLen = form.CustomFields.length;
  if (origLen !== formLen) return true;
  for (let i = 0; i < origLen; i++) {
    const o = original.CustomFields[i];
    const f = form.CustomFields[i];
    if (o.Name !== f.Name || o.Value !== f.Value) return true;
  }
  return false;
});

const dirty = computed(isDirty);

const isValid = computed(() => {
  errors.Title = '';
  errors.Url = '';
  let valid = true;
  if (!isNonEmpty(form.Title)) {
    errors.Title = 'Title is required';
    valid = false;
  }
  if (form.Url && !isValidUrl(form.Url)) {
    errors.Url = 'Invalid URL format';
    valid = false;
  }
  return valid;
});

function refreshPassword() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  let result = '';
  const len = 20;
  const arr = new Uint32Array(len);
  crypto.getRandomValues(arr);
  for (let i = 0; i < len; i++) {
    result += chars[arr[i] % chars.length];
  }
  generatedPassword.value = result;
}

function useGeneratedPassword() {
  form.Password = generatedPassword.value;
  showGenerator.value = false;
}

function copyPassword() {
  navigator.clipboard.writeText(generatedPassword.value).catch(() => {});
}

const canSave = computed(() => dirty.value && isValid.value && Boolean(form.Title.trim()));

function addCustomField() {
  form.CustomFields.push({ Name: '', Value: '', IsProtected: false });
}

function removeCustomField(idx) {
  form.CustomFields.splice(idx, 1);
}

function onKeydown(e) {
  if ((e.metaKey || e.ctrlKey) && e.key === 's') {
    e.preventDefault();
    if (canSave.value) onSave();
  }
  if (e.key === 'Escape' && dirty.value) {
    e.preventDefault();
    if (confirm('You have unsaved changes. Discard them?')) {
      emit('cancel');
    }
  }
}

function onCancel() {
  if (dirty.value) {
    if (!confirm('You have unsaved changes. Discard them?')) return;
  }
  emit('cancel');
}

function onSave() {
  if (!canSave.value) return;
  emit('save', {
    Title: form.Title,
    Url: form.Url,
    UserName: form.UserName,
    Password: form.Password,
    Group: form.Group,
    CustomFields: form.CustomFields.filter(f => f.Name.trim()),
  });
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown);
  refreshPassword();
});

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown);
});
</script>

<style scoped>
.form { display: flex; flex-direction: column; background: var(--color-surface); border-top: 1px solid var(--color-border); }
.form__header { display: flex; align-items: center; justify-content: space-between; padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--color-border); }
.form__header h2 { margin: 0; font-size: var(--text-md); font-weight: 600; }
.form__close { background: transparent; border: none; width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; color: var(--color-text-secondary); border-radius: var(--radius-sm); }
.form__close:hover { background: var(--color-bg); color: var(--color-text); }
.form__body { padding: var(--space-4); display: flex; flex-direction: column; gap: var(--space-3); max-height: 400px; overflow-y: auto; }
.form__custom { display: flex; flex-direction: column; gap: var(--space-2); margin-top: var(--space-2); padding-top: var(--space-3); border-top: 1px solid var(--color-border); }
.form__custom-header { display: flex; align-items: center; justify-content: space-between; font-size: var(--text-sm); font-weight: 600; }
.form__add-custom { display: inline-flex; align-items: center; gap: var(--space-1); padding: var(--space-1) var(--space-2); background: transparent; border: 1px solid var(--color-border); border-radius: var(--radius-md); color: var(--color-text); font-size: var(--text-xs); cursor: pointer; }
.form__add-custom:hover { background: var(--color-bg); }
.form__custom-row { display: flex; gap: var(--space-2); align-items: center; }
.form__remove-custom { background: transparent; border: 1px solid var(--color-border); color: var(--color-danger); width: 36px; height: 36px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; border-radius: var(--radius-md); flex-shrink: 0; }
.form__remove-custom:hover { background: var(--color-danger-subtle); }
.form__footer { display: flex; gap: var(--space-2); justify-content: flex-end; padding: var(--space-3) var(--space-4); border-top: 1px solid var(--color-border); }
</style>
