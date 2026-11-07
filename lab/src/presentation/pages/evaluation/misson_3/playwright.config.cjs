const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: '.', testMatch: 'mission3.spec.cjs',
  use: { baseURL: 'http://127.0.0.1:5183', viewport: { width: 1920, height: 1080 }, browserName: 'chromium' },
  webServer: { command: 'npm run dev -- --host 127.0.0.1 --port 5183 --strictPort', url: 'http://127.0.0.1:5183', reuseExistingServer: false },
});
