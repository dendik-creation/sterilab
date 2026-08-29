import { defineConfig } from '@playwright/test';

// Every real device the app supports is landscape-only (ADR-0002), so every
// viewport below is intentionally width > height. Sizes come from
// TASKS.md > QA dan Release's own device matrix.
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5173',
  },
  webServer: {
    command: 'npm run dev -- --port 5173 --strictPort',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
  projects: [
    { name: 'phone-landscape-568x320', use: { viewport: { width: 568, height: 320 } } },
    { name: 'phone-landscape-667x375', use: { viewport: { width: 667, height: 375 } } },
    { name: 'tablet-landscape-1024x768', use: { viewport: { width: 1024, height: 768 } } },
    { name: 'desktop-1366x768', use: { viewport: { width: 1366, height: 768 } } },
    { name: 'desktop-1440x900', use: { viewport: { width: 1440, height: 900 } } },
    { name: 'phone-portrait-block-375x667', use: { viewport: { width: 375, height: 667 } } },
  ],
});
