export function useToast() {
  function show(msg, options = {}) {
    const duration = options.duration !== undefined ? options.duration : 4000;
    const variant = options.variant || 'info';
    const el = document.createElement('div');
    el.textContent = msg;
    Object.assign(el.style, {
      position: 'fixed', bottom: '12px', left: '50%', transform: 'translateX(-50%)',
      padding: '8px 16px', borderRadius: '6px', fontSize: '12px', fontFamily: 'system-ui, sans-serif',
      zIndex: '9999', maxWidth: '280px', textAlign: 'center', lineHeight: '1.4',
      transition: 'opacity 200ms ease', opacity: '0',
      background: variant === 'error' ? '#ef4444' : variant === 'success' ? '#10b981' : variant === 'warning' ? '#f59e0b' : '#3b82f6',
      color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    });
    document.body.appendChild(el);
    requestAnimationFrame(() => { el.style.opacity = '1'; });
    setTimeout(() => {
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 200);
    }, duration);
  }

  return { show };
}
