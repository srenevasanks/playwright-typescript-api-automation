import { readFileSync, cpSync, mkdirSync, writeFileSync } from 'node:fs';
const summary = JSON.parse(readFileSync('reports/regression/summary.json', 'utf8'));
if (
  summary.total < 1 ||
  summary.failed ||
  summary.skipped ||
  summary.flaky ||
  summary.runnerExitCode
)
  throw new Error('Publication gate failed');
mkdirSync('reports/site', { recursive: true });
cpSync('reports/regression/playwright', 'reports/site/playwright', { recursive: true });
cpSync('reports/regression/allure', 'reports/site/allure', { recursive: true });
cpSync('reports/regression/summary.json', 'reports/site/summary.json');
writeFileSync('reports/site/.nojekyll', '');
writeFileSync(
  'reports/site/index.html',
  `<!doctype html><html lang="en"><meta charset="utf-8"><title>TaskDesk API reports</title><body><h1>Playwright TypeScript API Automation Framework</h1><p>Full regression: ${summary.passed}/${summary.total} passed. ${summary.started}. Workers: ${summary.workers}.</p><ul><li><a href="playwright/">Playwright report</a></li><li><a href="allure/">Allure report</a></li><li><a href="summary.json">Execution summary</a></li></ul></body></html>`,
);
