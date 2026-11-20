import { defineConfig } from '@playwright/test';
const scope = process.env.TEST_SCOPE ?? 'regression';
const run = process.env.RUN_ID ?? scope;
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: 0,
  workers: Number(process.env.WORKERS ?? 1),
  timeout: 30000,
  expect: { timeout: 5000 },
  forbidOnly: true,
  grep: scope === 'regression' ? undefined : new RegExp(`@${scope}\\b`),
  reporter: [
    ['list'],
    ['html', { outputFolder: `reports/${run}/playwright`, open: 'never' }],
    ['json', { outputFile: `reports/${run}/results.json` }],
    [
      'allure-playwright',
      {
        resultsDir: `reports/${run}/allure-results`,
        detail: true,
        environmentInfo: {
          node: process.version,
          application: 'TaskDesk / PocketBase 0.40.6',
          scope,
          workers: process.env.WORKERS ?? '1',
        },
      },
    ],
  ],
  outputDir: `reports/${run}/test-results`,
  use: { baseURL: process.env.API_BASE_URL ?? 'http://127.0.0.1:8090', trace: 'off' },
  webServer: {
    command: 'node scripts/start-app.mjs',
    url: 'http://127.0.0.1:8090/api/health',
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
