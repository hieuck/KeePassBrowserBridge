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
        '**/*.config.{js,ts}',
        'extension/contentScript.js',
        'extension/dist/',
        'extension/src/popup/**',
        'extension/src/options/**',
        'extension/src/components/**',
        'extension/shared/design-tokens.js',
        'scripts/**',
        'coverage/',
        'extension/compat.js',
        'extension/httpAuth.js',
        'extension/customFields.js',
        'extension/icons.js',
        'extension/passkeysProxyExperiment.js',
        'extension/enhancedSecurity_part1.js',
        'extension/enhancedSecurity_part2.js',
        'extension/groupOrganization.js',
        'extension/multiDatabase.js',
        'extension/multiPageLogin.js',
        'extension/background.js',
        'extension/src/composables/**',
        'extension/shared/field-classifier.js',
        'extension/shared/storage.js',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80
      }
    },
    testTimeout: 10000,
    hookTimeout: 10000
  }
});
