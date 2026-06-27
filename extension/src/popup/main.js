import { createApp } from 'vue';
import 'ant-design-vue/dist/reset.css';
import { registerAntd } from '../shared/antd-plugin.js';
import App from './App.vue';

const app = createApp(App);
registerAntd(app);
app.mount('#app');
