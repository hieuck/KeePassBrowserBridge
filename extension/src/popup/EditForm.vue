<template>
  <div class="form">
    <header class="form__header">
      <h2>Editing {{ entry?.Title || '' }}</h2>
      <button type="button" class="form__close-btn" aria-label="Close form" @click="onCancel">&#x2715;</button>
    </header>
    <div class="form__body">
      <div class="form__field">
        <label class="form__label">Title</label>
        <input class="form__input" :class="{ 'form__input--error': validationErrors.Title }" v-model="form.Title" />
        <span v-if="validationErrors.Title" class="form__error">{{ validationErrors.Title }}</span>
      </div>
      <div class="form__field">
        <label class="form__label">URL</label>
        <input class="form__input form__input--url" :class="{ 'form__input--error': validationErrors.Url }" v-model="form.Url" type="url" />
        <span v-if="validationErrors.Url" class="form__error">{{ validationErrors.Url }}</span>
      </div>
      <div class="form__field">
        <label class="form__label">Username</label>
        <input class="form__input" v-model="form.UserName" />
      </div>
      <div class="form__field">
        <label class="form__label">Password</label>
        <div class="form__password-wrap">
          <input class="form__input" :type="showPassword ? 'text' : 'password'" v-model="form.Password" />
          <button type="button" class="form__toggle-btn" @click="showPassword = !showPassword">
            <span v-if="showPassword">&#x1F441;</span><span v-else>&#x1F575;</span>
          </button>
        </div>
      </div>
      <div class="form__password-actions"></div>
      <div class="form__field">
        <label class="form__label">Folder</label>
        <input class="form__input" v-model="form.Group" />
      </div>
      <div class="form__custom">
        <div class="form__custom-header">
          <span>Custom fields</span>
          <button type="button" class="form__add-btn" @click="addCustomField"><PlusOutlined /> Add field</button>
        </div>
        <div v-for="(field, idx) in form.CustomFields" :key="idx" class="form__custom-row">
          <input class="form__input" v-model="field.Name" placeholder="Name" />
          <div class="form__password-wrap">
            <input class="form__input" type="password" v-model="field.Value" placeholder="Value" />
          </div>
          <button type="button" class="form__remove-btn" aria-label="Remove field" @click="removeCustomField(idx)"><DeleteOutlined /></button>
        </div>
      </div>
    </div>
    <footer class="form__footer">
      <span v-if="dirty" class="form__dirty-dot" title="Unsaved changes">&#9679;</span>
      <button type="button" class="form__btn form__btn--cancel" @click="onCancel">Cancel</button>
      <button type="button" class="form__btn form__btn--primary" :disabled="!canSave" @click="onSave">Save changes</button>
    </footer>
  </div>
</template>

<script setup>
import { reactive, computed, ref, watch, onMounted, onUnmounted } from 'vue';
import { CloseOutlined, KeyOutlined, PlusOutlined, DeleteOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons-vue';
import PasswordGenerator from './PasswordGenerator.vue';
import { isValidUrl, isNonEmpty } from '../../shared/validators.js';
import { generatePassword } from '../../shared/password-generator.js';

const props = defineProps({ entry: { type: Object, required: true } });
const emit = defineEmits(['save', 'cancel']);

const form = reactive({
  Title: '',
  Url: '',
  UserName: '',
  Password: '',
  Group: '',
  CustomFields: [],
});

const snapshot = ref({ Title: '', Url: '', UserName: '', Password: '', Group: '', CustomFields: [] });

watch(() => props.entry, (entry) => {
  if (!entry) return;
  const data = {
    Title: entry.Title || '',
    Url: entry.Url || '',
    UserName: entry.UserName || '',
    Password: entry.Password || '',
    Group: entry.Group || '',
    CustomFields: JSON.parse(JSON.stringify(entry.CustomFields || [])),
  };
  Object.assign(form, data);
  snapshot.value = JSON.parse(JSON.stringify(data));
}, { immediate: true });

const showGenerator = ref(false);
const generatedPassword = ref('');
const showPassword = ref(false);

const isDirty = computed(() => {
  const s = snapshot.value;
  if (form.Title !== s.Title) return true;
  if (form.Url !== s.Url) return true;
  if (form.UserName !== s.UserName) return true;
  if (form.Password !== s.Password) return true;
  if (form.Group !== s.Group) return true;
  const origLen = s.CustomFields.length;
  const formLen = form.CustomFields.length;
  if (origLen !== formLen) return true;
  for (let i = 0; i < origLen; i++) {
    const o = s.CustomFields[i];
    const f = form.CustomFields[i];
    if (o.Name !== f.Name || o.Value !== f.Value) return true;
  }
  return false;
});

const dirty = computed(isDirty);

const validationErrors = computed(() => {
  const e = { Title: '', Url: '' };
  if (!isNonEmpty(form.Title)) e.Title = 'Title is required';
  if (form.Url && !isValidUrl(form.Url)) e.Url = 'Invalid URL format';
  return e;
});

const isValid = computed(() => !validationErrors.value.Title && !validationErrors.value.Url);

function refreshPassword() {
  generatedPassword.value = generatePassword();
}

function useGeneratedPassword() {
  form.Password = generatedPassword.value;
  showGenerator.value = false;
}

function copyPassword() {
  navigator.clipboard.writeText(generatedPassword.value).catch(() => {});
}

const canSave = computed(() => dirty.value && isValid.value && Boolean(form.Title.trim()));

console.log('EditForm setup done, entry:', props.entry?.Title);

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
    ReplaceCustomFields: true,
  });
}

onMounted(() => {
  console.log('EditForm mounted, entry:', props.entry?.Title);
  document.addEventListener('keydown', onKeydown);
  refreshPassword();
});

onUnmounted(() => {
  console.log('EditForm unmounted');
  document.removeEventListener('keydown', onKeydown);
});
</script>

<style scoped>
.form { display: flex; flex-direction: column; background: var(--color-surface); border-top: 1px solid var(--color-border); }
.form__header { display: flex; align-items: center; justify-content: space-between; padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--color-border); }
.form__header h2 { margin: 0; font-size: var(--text-md); font-weight: 600; }
.form__close-btn { background: transparent; border: none; width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; color: var(--color-text-secondary); border-radius: var(--radius-sm); transition: background var(--transition-fast), color var(--transition-fast); }
.form__close-btn:hover { background: var(--color-bg); color: var(--color-text); }
.form__body { padding: var(--space-4); display: flex; flex-direction: column; gap: var(--space-3); max-height: 400px; overflow-y: auto; }
.form__field { display: flex; flex-direction: column; gap: 4px; }
.form__label { font-size: var(--text-xs); font-weight: 600; color: var(--color-text-secondary); }
.form__input { width: 100%; padding: 6px 10px; font-size: var(--text-sm); font-family: var(--font-sans); border: 1px solid var(--color-border); border-radius: var(--radius-sm); background: var(--color-bg); color: var(--color-text); outline: none; transition: border-color var(--transition-fast); box-sizing: border-box; }
.form__input:focus { border-color: var(--color-accent); }
.form__input--error { border-color: var(--color-danger); }
.form__input--url { font-family: var(--font-mono); font-size: var(--text-xs); }
.form__error { font-size: var(--text-xs); color: var(--color-danger); }
.form__password-wrap { display: flex; gap: 0; position: relative; }
.form__password-wrap .form__input { padding-right: 32px; }
.form__toggle-btn { position: absolute; right: 4px; top: 50%; transform: translateY(-50%); background: transparent; border: none; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; color: var(--color-text-secondary); border-radius: var(--radius-sm); }
.form__toggle-btn:hover { color: var(--color-text); }
.form__password-actions { margin-top: -4px; }
.form__link-btn { background: transparent; border: none; cursor: pointer; font-size: var(--text-sm); color: var(--color-accent); font-family: inherit; display: inline-flex; align-items: center; gap: var(--space-1); padding: 2px 0; }
.form__link-btn:hover { text-decoration: underline; }
.form__custom { display: flex; flex-direction: column; gap: var(--space-2); margin-top: var(--space-2); padding-top: var(--space-3); border-top: 1px solid var(--color-border); }
.form__custom-header { display: flex; align-items: center; justify-content: space-between; font-size: var(--text-sm); font-weight: 600; }
.form__add-btn { background: transparent; border: 1px dashed var(--color-border); cursor: pointer; font-size: var(--text-xs); color: var(--color-text-secondary); font-family: inherit; display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: var(--radius-sm); transition: border-color var(--transition-fast), color var(--transition-fast); }
.form__add-btn:hover { border-color: var(--color-accent); color: var(--color-accent); }
.form__custom-row { display: flex; gap: var(--space-2); align-items: center; }
.form__custom-row .form__input { flex: 1; }
.form__remove-btn { background: transparent; border: none; width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; color: var(--color-text-secondary); border-radius: var(--radius-sm); flex-shrink: 0; transition: color var(--transition-fast), background var(--transition-fast); }
.form__remove-btn:hover { color: var(--color-danger); background: var(--color-danger-subtle); }
.form__footer { display: flex; gap: var(--space-2); justify-content: flex-end; padding: var(--space-3) var(--space-4); border-top: 1px solid var(--color-border); align-items: center; }
.form__dirty-dot { color: var(--color-warning); font-size: 12px; margin-right: auto; }
.form__btn { padding: 6px 16px; font-size: var(--text-sm); font-family: var(--font-sans); border-radius: var(--radius-sm); cursor: pointer; transition: all var(--transition-fast); border: 1px solid var(--color-border); background: transparent; color: var(--color-text-secondary); }
.form__btn:hover { border-color: var(--color-accent); color: var(--color-accent); }
.form__btn--primary { background: var(--color-accent); color: #fff; border: none; }
.form__btn--primary:hover { opacity: 0.85; }
.form__btn--primary:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
