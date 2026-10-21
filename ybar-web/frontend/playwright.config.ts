import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: [{
    command: `node -e "require('fs').rmSync('data/e2e.db', {force:true})" && npm run migrate && npm run seed && npm start`,
    cwd: '../backend',
    env: { DATABASE_PATH: 'data/e2e.db', PORT: '3001', UPLOADS_DIR: 'uploads/e2e' },
    url: 'http://localhost:3001/api/health',
    reuseExistingServer: false,
  }, {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  }],
});
