const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({ testDir: '.', testMatch: 'mission2.spec.cjs', use: { baseURL: 'http://localhost:5173', viewport: { width: 1440, height: 810 } }, webServer: { command: 'npm run dev -- --port 5173 --strictPort', url: 'http://localhost:5173', reuseExistingServer: true, timeout: 30000 } });
