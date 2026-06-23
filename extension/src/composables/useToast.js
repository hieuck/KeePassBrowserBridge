import { message } from 'ant-design-vue';

export function useToast() {
  function show(msg, options = {}) {
    const duration = options.duration !== undefined ? options.duration / 1000 : 4;
    const variant = options.variant || 'info';
    const type = variant === 'error' ? 'error' : variant === 'success' ? 'success' : variant === 'warning' ? 'warning' : 'info';
    message[type](msg, duration);
  }

  return { show };
}
