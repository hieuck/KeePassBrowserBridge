<template>
  <div class="credential-item" :data-entry-idx="entryIndex">
    <div class="item-main">
      <div class="item-avatar" :style="avatarStyle">{{ avatarLetter }}</div>
      <div class="item-info">
        <div class="item-title">{{ entry.Title || '(Untitled)' }}</div>
        <div v-if="entry.UserName" class="item-subtitle">{{ entry.UserName }}</div>
        <div v-if="metaText" class="item-meta">{{ metaText }}</div>
        <div v-if="entry.Password" class="strength-row">
          <div class="strength-bar" :style="{ width: strength.width, background: strength.color }"></div>
          <span class="strength-label" :style="{ color: strength.color }">{{ strength.label }}</span>
        </div>
        <div v-if="metaRowParts.length" class="item-metarow">
          <span v-for="(part, i) in metaRowParts" :key="i">
            <span v-if="i > 0"> · </span><span v-html="part"></span>
          </span>
        </div>
      </div>
    </div>
    <div class="item-actions">
      <button class="btn-autofill" type="button" @click.stop="$emit('fill', entry)">✓ Autofill</button>
      <button v-if="entry.UserName" class="btn-copy" type="button" @click.stop="$emit('copy', 'username', entry.UserName)">Copy U</button>
      <button v-if="entry.Password" class="btn-copy" type="button" @click.stop="$emit('copy', 'password', entry.Password)">Copy P</button>
      <button v-if="entry.OneTimePassword" class="btn-copy" type="button" @click.stop="$emit('copy', 'OTP', entry.OneTimePassword)">OTP</button>
    </div>
    <div v-if="entry.CustomFields && entry.CustomFields.length" class="custom-fields">
      <div v-for="field in entry.CustomFields" :key="field.Name" class="custom-field">
        <span class="field-name">{{ field.Name }}:</span>
        <span class="field-value">{{ field.IsProtected ? '••••••••' : field.Value }}</span>
        <template v-if="!field.IsProtected">
          <button type="button" class="field-fill-btn" :title="'Fill focused field with ' + field.Name" @click.stop="$emit('fill', entry, 'custom', field.Name)">Fill {{ field.Name }}</button>
          <button type="button" class="copy-btn" title="Copy to clipboard" @click.stop="$emit('copy', field.Name, field.Value)">📋</button>
        </template>
      </div>
    </div>
    <button type="button" class="btn-edit" :disabled="!canEdit" @click.stop="$emit('edit', entry)">✎ Edit</button>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  entry: { type: Object, required: true },
  entryIndex: { type: Number, default: -1 },
  canEdit: { type: Boolean, default: false },
  maxUsage: { type: Number, default: 0 }
});

const emit = defineEmits(['fill', 'copy', 'edit', 'select']);

const AVATAR_COLORS = ['#175cd3', '#b42318', '#067647', '#b54708', '#6941c6', '#363f72', '#c01048', '#4a90e2'];

const avatarLetter = computed(() => (props.entry.Title || '?')[0].toUpperCase());

const avatarStyle = computed(() => {
  const colorIndex = (props.entry.Title || '').length % AVATAR_COLORS.length;
  const style = { backgroundColor: AVATAR_COLORS[colorIndex] };
  if (props.entry.Url) {
    style.backgroundImage = 'url(https://www.google.com/s2/favicons?domain=' + encodeURIComponent(props.entry.Url) + '&sz=32)';
    style.backgroundSize = 'cover';
    style.backgroundPosition = 'center';
    style.color = 'transparent';
  }
  return style;
});

const metaText = computed(() => {
  const parts = [];
  if (props.entry.UsageCount >= props.maxUsage && props.maxUsage > 0) parts.push('★ Most used');
  if (props.entry.Group) parts.push(props.entry.Group);
  if (props.entry.Url) parts.push(props.entry.Url);
  if (props.entry.FrequencyRank && props.entry.FrequencyRank <= 3) parts.unshift('★ Frequent');
  return parts.join(' · ');
});

const metaRowParts = computed(() => {
  const parts = [];
  if (props.entry.LastUsed) {
    parts.push('<span class="last-used">🕐 ' + getRelativeTime(props.entry.LastUsed) + '</span>');
  }
  if (props.entry.UsageCount && props.entry.UsageCount > 0) {
    parts.push('<span class="usage-count">🔁 ' + props.entry.UsageCount + 'x</span>');
  }
  return parts;
});

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

const strength = computed(() => getPasswordStrength(props.entry.Password));

function onClick(e) {
  if (e.target.closest('button, input, select, textarea, a')) return;
  emit('select', props.entry);
}
</script>
