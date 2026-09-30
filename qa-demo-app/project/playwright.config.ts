import { defineConfig } from '@playwright/test';
export default defineConfig({ testDir: 'tests', timeout: 30000, retries: process.env.CI ? 1 : 0, reporter: [['html', { open: 'never' }], ['list']],
  use: { baseURL: 'http://localhost:3001', trace: 'on-first-retry', screenshot: 'only-on-failure' },
  webServer: { command: 'npm run build && npm start', url: 'http://localhost:3001', reuseExistingServer: !process.env.CI, timeout: 120000 } });
