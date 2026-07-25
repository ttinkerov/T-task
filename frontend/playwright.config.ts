import { defineConfig, devices } from '@playwright/test';

const frontendURL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
const backendURL = process.env.E2E_API_URL ?? 'http://localhost:3001';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [['list']],
  use: {
    baseURL: frontendURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'npm run dev -w backend',
      cwd: '..',
      url: `${backendURL}/health/live`,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
    {
      command: 'npm run dev -w frontend',
      cwd: '..',
      url: frontendURL,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
  ],
});
