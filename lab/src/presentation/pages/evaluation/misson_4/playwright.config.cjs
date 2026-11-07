const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: '.', testMatch: 'mission4.spec.cjs',
  use: { baseURL: 'http://127.0.0.1:5184', viewport: { width: 1920, height: 1080 }, browserName: 'chromium' },
  webServer: { command: 'npm run dev -- --host 127.0.0.1 --port 5184 --strictPort', url: 'http://127.0.0.1:5184', reuseExistingServer: false },
});
