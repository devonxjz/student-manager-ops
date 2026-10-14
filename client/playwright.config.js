import { defineConfig, devices } from '@playwright/test';

const PORT = 5199;

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  workers: 4,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    channel: 'chrome', // dùng Chrome đã cài trên máy; bỏ dòng này nếu đã chạy `npx playwright install chromium`
    trace: 'retain-on-failure',
    locale: 'vi-VN',
    viewport: { width: 1440, height: 900 },
  },
  projects: [{ name: 'chrome', use: { ...devices['Desktop Chrome'], channel: 'chrome', viewport: { width: 1440, height: 900 } } }],
  webServer: {
    command: `npx vite --mode mock --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
