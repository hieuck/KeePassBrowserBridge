<template>
  <div class="empty-state">
    <div class="empty-icon">🔐</div>
    <div class="empty-title">No KeePass logins found for this page.</div>
    <div class="empty-hint">Create a new entry or adjust URL matching in settings.</div>
    <button id="emptyCreateLogin" class="btn-new-login" type="button" @click="$emit('create-login')">+ New Login</button>
  </div>
</template>

<script setup>
defineEmits(['create-login']);
</script>
