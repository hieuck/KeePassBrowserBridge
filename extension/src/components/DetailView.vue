<template>
  <div class="detail-view" :class="{ hidden: !entry }">
    <div class="detail-header">
      <button class="detail-back-btn" type="button" @click="$emit('back')">← Back</button>
    </div>
    <div class="detail-body">
      <div class="detail-avatar-section">
        <div class="detail-avatar" :style="avatarStyle">{{ avatarLetter }}</div>
        <div>
          <div class="detail-title" id="detailTitle">{{ entryTitle }}</div>
          <div class="detail-subtitle" id="detailSubtitle">{{ entrySubtitle }}</div>
        </div>
      </div>
      <div class="detail-fields" id="detailFields">
        <template v-for="field in detailFields" :key="field.label">
          <div class="detail-field">
            <div class="detail-field-label">{{ field.label }}</div>
            <div class="detail-field-row">
              <div class="detail-field-value">{{ field.value }}</div>
              <button v-if="field.copyable" class="btn-copy" type="button" title="Copy" @click="field.copy">📋</button>
            </div>
          </div>
          <div v-if="field.strength" class="strength-row" style="margin-top:4px;margin-bottom:12px">
            <div class="strength-bar" :style="{ width: field.strength.width, background: field.strength.color, maxWidth: '120px' }"></div>
            <span style="font-size:12px;font-weight:600;color:field.strength.color">{{ field.strength.label }}</span>
          </div>
        </template>
      </div>
    </div>
    <div class="detail-actions">
      <button class="detail-fill-btn btn-autofill" type="button" @click="$emit('fill', entry)">✓ Autofill</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  entry: { type: Object, default: null }
});

const emit = defineEmits(['back', 'fill']);

const AVATAR_COLORS = ['#4a90e2', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#34495e', '#e91e63', '#00bcd4'];

const avatarLetter = computed(() => (props.entry ? (props.entry.Title || '?')[0].toUpperCase() : '?'));

const avatarStyle = computed(() => {
  if (!props.entry) return {};
  const colorIndex = (props.entry.Title || '').length % AVATAR_COLORS.length;
  return { backgroundColor: AVATAR_COLORS[colorIndex] };
});

const entryTitle = computed(() => (props.entry ? (props.entry.Title || '(Untitled)') : ''));

const entrySubtitle = computed(() => {
  if (!props.entry) return '';
  const parts = [];
  if (props.entry.Group) parts.push(props.entry.Group);
  if (props.entry.LastUsed) parts.push('Last used ' + getRelativeTime(props.entry.LastUsed));
  if (props.entry.UsageCount && props.entry.UsageCount > 0) parts.push(props.entry.UsageCount + ' uses');
  return parts.filter(Boolean).join(' · ');
});

function getRelativeTime(utcMs) {
  if (!utcMs || utcMs <= 0) return '';
  const now = Date.now();
  const diff = now - utcMs;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  const months = Math.floor(days / 30);
  if (mins < 1) return 'Just now';
  if (mins < 60) return mins + 'm ago';
  if (hours < 24) return hours + 'h ago';
  if (days < 30) return days + 'd ago';
  return months + 'mo ago';
}

function getPasswordStrength(password) {
  if (!password) return { score: 0, label: 'None', color: '#e0e0e0', width: '0%' };
  let score = 0;
  if (password.length >= 8) score += 25;
  if (password.length >= 12) score += 15;
  if (password.length >= 16) score += 10;
  if (password.length >= 20) score += 10;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 15;
  if (/\d/.test(password)) score += 10;
  if (/[^a-zA-Z0-9]/.test(password)) score += 15;
  if (password.length >= 8 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password)) score += 10;
  score = Math.min(100, Math.max(0, score));
  if (score >= 80) return { score, label: 'Strong', color: '#2ecc71', width: score + '%' };
  if (score >= 50) return { score, label: 'Medium', color: '#f39c12', width: score + '%' };
  return { score, label: 'Weak', color: '#e74c3c', width: Math.max(10, score) + '%' };
}

const detailFields = computed(() => {
  if (!props.entry) return [];
  const fields = [];
  fields.push({ label: 'Username', value: props.entry.UserName || '(not set)', copyable: true, copy: () => emit('copy', 'username', props.entry.UserName) });
  if (props.entry.Password) {
    const strength = getPasswordStrength(props.entry.Password);
    fields.push({
      label: 'Password',
      value: '•'.repeat(Math.min(props.entry.Password.length, 20)),
      copyable: false,
      strength
    });
  }
  if (props.entry.Url) fields.push({ label: 'URL', value: props.entry.Url, copyable: true, copy: () => emit('copy', 'url', props.entry.Url) });
  if (props.entry.OneTimePassword) fields.push({ label: 'TOTP', value: props.entry.OneTimePassword, copyable: true, copy: () => emit('copy', 'otp', props.entry.OneTimePassword) });
  for (const field of props.entry.CustomFields || []) {
    if (!field.IsProtected) {
      fields.push({ label: field.Name, value: field.Value, copyable: true, copy: () => emit('copy', field.Name.toLowerCase(), field.Value) });
    }
  }
  return fields;
});
</script>
