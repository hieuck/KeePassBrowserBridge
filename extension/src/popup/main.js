import { createApp } from 'vue';
import App from './App.vue';

const app = createApp(App);
app.config.errorHandler = (err) => {
  if (err.message?.includes('e.fn')) return false;
  console.error('Vue:', err);
};
app.mount('#app');
