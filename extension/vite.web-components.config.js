import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    lib: {
      entry: 'src/components/index.js',
      formats: ['es'],
      fileName: () => 'components.es.js',
    },
    rollupOptions: {
      external: [],
      output: {
        entryFileNames: 'components.es.js',
      },
    },
  },
});
