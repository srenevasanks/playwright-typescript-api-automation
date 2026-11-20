import { readFileSync, writeFileSync } from 'node:fs';
const names = [
  'smoke',
  'regression',
  'sequential-1',
  'sequential-2',
  'sequential-3',
  'parallel-1',
  'parallel-2',
];
const runs = names.map((name) => JSON.parse(readFileSync(`evidence/${name}-summary.json`, 'utf8')));
for (const run of runs)
  if (!run.total || run.failed || run.skipped || run.flaky || run.runnerExitCode)
    throw new Error(`Local gate failed: ${run.run}`);
writeFileSync(
  'docs/execution-summary.json',
  JSON.stringify(
    {
      application: 'TaskDesk / PocketBase 0.40.6',
      finalLocalRun: 'parallel-2',
      generated: new Date().toISOString(),
      githubActions: 'Pending publication; no success claimed',
      runs,
    },
    null,
    2,
  ) + '\n',
);
const rows = runs
  .map(
    (run) =>
      `| ${run.run} | ${run.scope} | ${run.workers} | ${run.passed}/${run.total} | ${run.failed} | ${run.skipped} | ${run.flaky} | ${(run.durationMs / 1000).toFixed(2)} | ${run.started} |`,
  )
  .join('\n');
writeFileSync(
  'docs/execution-summary.md',
  `# Execution summary\n\nI executed the actual API suite on Windows with Node ${runs[0].node}, Playwright ${runs[0].playwright}, npm 11.18.0 and PocketBase 0.40.6. Times below are UTC (Asia/Kolkata is UTC+05:30). All final local executions occurred on 20 November 2026. Smoke and regression are separate scopes.\n\n| Run | Scope | Workers | Passed/total | Failed | Skipped | Flaky | Seconds | Started UTC |\n| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |\n${rows}\n\nEach full suite contains 72 distinct invocations. The three sequential stability repetitions followed a passing baseline, then two two-worker runs passed. Retries were zero. No cleanup failure was reported. This is observed stability, not a guarantee of future non-flakiness.\n\nThe final local report represents **parallel-2**, with Playwright HTML at \`reports/parallel-2/playwright/index.html\` and Allure HTML at \`reports/parallel-2/allure/index.html\`. Allure and Playwright durations measure different intervals: Playwright includes runner startup/teardown, while Allure's interval spans individual test results. Counts are reconciled automatically. Per-run JSON evidence is in \`evidence/*-summary.json\`; combined machine-readable evidence is \`docs/execution-summary.json\`.\n\nClean \`npm ci\`, TypeScript, ESLint, Prettier, all scope commands, the pinned application installer and a separate SQLite process-restart persistence probe were executed. Final report rendering and credential checks are recorded in \`docs/report-quality.md\`.\n\nGitHub Actions and Pages: pending publication. Hosted success will be recorded only after actual hosted verification.\n`,
);
