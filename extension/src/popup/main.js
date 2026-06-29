import { createApp, onErrorCaptured } from 'vue';
import App from './App.vue';

const app = createApp(App);
app.config.errorHandler = (err, _instance, info) => {
  if (err.message?.includes('e.fn') || err.message?.includes('fn is not a function')) {
    return false;
  }
  console.error('Vue error:', err, info);
};
app.mount('#app');
