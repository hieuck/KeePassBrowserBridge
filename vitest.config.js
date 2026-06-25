import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    include: ['tests/**/*.test.{js,ts,mjs}', 'extension/tests/**/*.test.mjs'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache', 'tests/extension/**/*.test.mjs'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        'dist/',
        '*.config.{js,ts}',
        'extension/contentScript.js'
      ],
      lines: 80,
      functions: 80,
      branches: 75,
      statements: 80
    },
    testTimeout: 10000,
    hookTimeout: 10000
  }
});
