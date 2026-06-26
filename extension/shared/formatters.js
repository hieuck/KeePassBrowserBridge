export function formatRelativeTime(timestampMs) {
  if (!timestampMs || timestampMs <= 0) return 'Never';
  const diff = Date.now() - timestampMs;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  const months = Math.floor(days / 30);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return `${months}mo ago`;
}

export function truncate(str, max = 50) {
  if (!str) return '';
  if (str.length <= max) return str;
  return str.slice(0, max - 1) + '\u2026';
}
