import { resolve } from 'node:path';
import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.QA_BASE_URL;
const testDir = process.env.QA_TEST_DIR;

if (!baseURL || !testDir) {
  throw new Error('QA_BASE_URL and QA_TEST_DIR must be set. Run the suite through `npm run qa`.');
}

export default defineConfig({
  testDir: resolve(import.meta.dirname, testDir),
  outputDir: process.env.QA_OUTPUT_DIR ?? resolve(import.meta.dirname, 'test-results'),
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  forbidOnly: true,
  reporter: [['list'], ['./support/playwright-progress-reporter.ts']],
  use: {
    baseURL,
    headless: true,
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
