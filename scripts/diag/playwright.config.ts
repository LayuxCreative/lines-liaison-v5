import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['html', { outputFolder: '../../artifacts/diag/playwright-report' }],
    ['list']
  ],
  outputDir: '../../artifacts/diag/test-results',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'npm run dev',
      port: 5173,
      cwd: '../../',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npm start',
      port: 3001,
      cwd: '../../backend',
      reuseExistingServer: !process.env.CI,
    }
  ],
});