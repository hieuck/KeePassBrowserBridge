import { defineConfig, devices } from '@playwright/test';
import { DEFAULT_E2E_PORT } from './tests/e2e/e2e-port.mjs';

const e2ePort = Number(process.env.PORT || DEFAULT_E2E_PORT);
const e2eBaseURL = `http://127.0.0.1:${e2ePort}`;

export default defineConfig({
  testDir: './tests',
  testMatch: [
    '**/e2e/**/*.spec.js',
    '**/extension/**/*.test.mjs',
    '**/visual/**/*.spec.js',
    '**/accessibility/**/*.spec.js',
  ],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 60000,
  expect: { timeout: 15000 },
  reporter: 'html',
  use: {
    baseURL: e2eBaseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'msedge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: e2eBaseURL,
    reuseExistingServer: !process.env.CI,
  },
});
