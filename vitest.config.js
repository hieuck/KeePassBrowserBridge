import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    include: ['tests/**/*.test.{js,ts,mjs}', 'extension/tests/**/*.test.mjs'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache', 'tests/extension/**/*.test.mjs'],
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        'dist/',
        '**/*.config.{js,ts}',
        'extension/contentScript.js',
        'extension/dist/',
        'extension/shared/design-tokens.js',
        'scripts/**',
        'coverage/',
        'extension/compat.js',
        'extension/httpAuth.js',
        'extension/customFields.js',
        'extension/icons.js',
        'extension/passkeysProxy.js',
        'extension/passkeysProxyExperiment.js',
        'extension/enhancedSecurity_part1.js',
        'extension/enhancedSecurity_part2.js',
        'extension/groupOrganization.js',
        'extension/multiDatabase.js',
        'extension/multiPageLogin.js',
        'extension/background.js',
        'extension/popup.html',
        'extension/options.html',
        'extension/_locales/**',
        'extension/managed_storage.json',
        'extension/shared/field-classifier.js',
        'extension/src/shared/antd-plugin.js',
        'extension/shared/antd-plugin.js',
        'extension/shared/storage.js',
        'extension/src/options/**',
      ],
      thresholds: {
        lines: 30,
        functions: 70,
        branches: 75,
        statements: 30
      }
    },
    testTimeout: 10000,
    hookTimeout: 10000
  }
});
