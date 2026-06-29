import { createApp } from 'vue';
import 'ant-design-vue/dist/reset.css';
import { registerAntd } from '../shared/antd-plugin.js';
import App from './App.vue';

const app = createApp(App);
app.config.errorHandler = (err) => {
  if (err.message?.includes('e.fn')) return false;
  console.error('Vue:', err);
};
registerAntd(app);
app.mount('#app');
