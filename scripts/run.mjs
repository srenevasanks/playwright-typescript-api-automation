import { spawnSync } from 'node:child_process';
import { rmSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
const scope = process.argv[2] ?? 'regression';
const run = process.env.RUN_ID ?? scope;
if (!/^[a-z0-9-]+$/.test(run))
  throw new Error('RUN_ID must contain only lowercase letters, digits and hyphens');
const folder = `reports/${run}`;
rmSync(folder, { recursive: true, force: true });
mkdirSync(folder, { recursive: true });
const started = new Date().toISOString();
const result = spawnSync(process.execPath, ['node_modules/@playwright/test/cli.js', 'test'], {
  stdio: 'inherit',
  env: { ...process.env, TEST_SCOPE: scope, RUN_ID: run },
});
if (result.error) throw result.error;
let exit = result.status ?? 1;
try {
  const report = JSON.parse(readFileSync(`${folder}/results.json`, 'utf8'));
  const stats = report.stats;
  const summary = {
    run,
    started,
    completed: new Date().toISOString(),
    application: 'TaskDesk / PocketBase 0.40.6',
    environment: process.env.CI ? 'GitHub Actions' : `${process.platform} local`,
    node: process.version,
    playwright: JSON.parse(readFileSync('node_modules/@playwright/test/package.json', 'utf8'))
      .version,
    total: stats.expected + stats.unexpected + stats.skipped + stats.flaky,
    passed: stats.expected,
    failed: stats.unexpected,
    skipped: stats.skipped,
    flaky: stats.flaky,
    durationMs: stats.duration,
    workers: Number(process.env.WORKERS ?? 1),
    scope,
    reports: { playwright: `${folder}/playwright`, allure: `${folder}/allure` },
    githubActions: process.env.GITHUB_RUN_ID
      ? `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
      : 'Not executed',
    runnerExitCode: exit,
  };
  writeFileSync(`${folder}/summary.json`, JSON.stringify(summary, null, 2));
  mkdirSync('evidence', { recursive: true });
  writeFileSync(`evidence/${run}-summary.json`, JSON.stringify(summary, null, 2));
  if (!summary.total || summary.failed || summary.skipped || summary.flaky || report.errors.length)
    exit = 1;
} catch (error) {
  console.error(error);
  exit = 1;
}
process.exit(exit);
