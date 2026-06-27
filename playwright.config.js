import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const e2ePort = Number(process.env.PORT || 3000);
const e2eBaseURL = `http://127.0.0.1:${e2ePort}`;
const extensionPath = path.resolve(__dirname, 'extension');

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
  reporter: 'html',
  use: {
    baseURL: e2eBaseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        launchOptions: {
          args: [
            `--disable-extensions-except=${extensionPath}`,
            `--load-extension=${extensionPath}`,
            '--headless=new',
          ],
        },
      },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
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
