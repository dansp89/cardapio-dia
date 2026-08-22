import { createApp } from 'vue';
import App from './App.vue';
import './style.css';
import { registrarSw } from './lib/pwa';

createApp(App).mount('#app');
registrarSw();
