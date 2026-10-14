import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/support/setup.ts',
  fullyParallel: false,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: { baseURL: 'http://127.0.0.1:3002', trace: 'retain-on-failure' },
  reporter: [['list'], ['html', { open: 'never' }]],
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'npm run start -- --port 3002',
      env: {
        NODE_OPTIONS: '--import ./tests/support/source-fixtures.mjs',
        KHULLAPATRO_CACHE_DIR: '.cache/playwright',
        KHULLAPATRO_CACHE_STORAGE: 'file',
        AUTH_GITHUB_ID: '',
        AUTH_GITHUB_SECRET: '',
        AUTH_URL: 'http://127.0.0.1:3002',
      },
      url: 'http://127.0.0.1:3002',
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: 'npm run start -- --port 3004',
      env: {
        NODE_OPTIONS: '--import ./tests/support/source-fixtures.mjs',
        KHULLAPATRO_CACHE_DIR: '.cache/playwright-auth',
        KHULLAPATRO_CACHE_STORAGE: 'file',
        AUTH_URL: 'http://localhost:3004',
        AUTH_SECRET: 'khullapatro-test-only-key-never-use-in-production',
        AUTH_GITHUB_ID: 'khullapatro-test-client',
        AUTH_GITHUB_SECRET: 'not-a-provider-secret',
      },
      url: 'http://127.0.0.1:3004',
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
