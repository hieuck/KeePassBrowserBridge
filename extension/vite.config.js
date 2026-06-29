import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { readFileSync, copyFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

function copyPasskeysProxy() {
  return {
    name: 'copy-passkeys-proxy',
    closeBundle() {
      const src = resolve(__dirname, 'passkeysProxy.js');
      const dest = resolve(__dirname, 'dist', 'passkeysProxy.js');
      if (existsSync(src)) {
        copyFileSync(src, dest);
        console.log('Copied passkeysProxy.js to dist/');
      }
    }
  };
}

export default defineConfig({
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [vue(), copyPasskeysProxy()],
  build: {
    chunkSizeWarningLimit: 2000,
    outDir: 'dist',
    emptyOutDir: false,
    rollupOptions: {
      input: {
        popup: 'src/popup/main.js',
        options: 'src/options/main.js',
        contentScript: 'contentScript.js',
        background: 'background.js',
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
        manualChunks(id) {
          if (id.includes('node_modules/vue')) {
            return 'vue-vendor';
          }
          if (id.includes('node_modules/ant-design-vue')) {
            return 'antd-vendor';
          }
          if (id.includes('node_modules/@ant-design/icons-vue')) {
            return 'icons-vendor';
          }
        },
      },
    },
  },
});
