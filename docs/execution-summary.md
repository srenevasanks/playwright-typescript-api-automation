# Execution summary

I executed the actual API suite on Windows with Node v24.11.1, Playwright 1.65.1, npm 11.18.0 and PocketBase 0.40.6. Times below are UTC (Asia/Kolkata is UTC+05:30). All final local executions occurred on 20 November 2026. Smoke and regression are separate scopes.

| Run          | Scope      | Workers | Passed/total | Failed | Skipped | Flaky | Seconds | Started UTC              |
| ------------ | ---------- | ------: | -----------: | -----: | ------: | ----: | ------: | ------------------------ |
| smoke        | smoke      |       1 |          4/4 |      0 |       0 |     0 |    4.71 | 2026-11-20T17:07:04.861Z |
| regression   | regression |       1 |        72/72 |      0 |       0 |     0 |   35.04 | 2026-11-20T17:02:48.050Z |
| sequential-1 | regression |       1 |        72/72 |      0 |       0 |     0 |   33.92 | 2026-11-20T17:03:26.122Z |
| sequential-2 | regression |       1 |        72/72 |      0 |       0 |     0 |   33.71 | 2026-11-20T17:04:03.289Z |
| sequential-3 | regression |       1 |        72/72 |      0 |       0 |     0 |   37.01 | 2026-11-20T17:04:41.006Z |
| parallel-1   | regression |       2 |        72/72 |      0 |       0 |     0 |   18.95 | 2026-11-20T17:05:21.247Z |
| parallel-2   | regression |       2 |        72/72 |      0 |       0 |     0 |   17.31 | 2026-11-20T17:05:43.161Z |

Each full suite contains 72 distinct invocations. The three sequential stability repetitions followed a passing baseline, then two two-worker runs passed. Retries were zero. No cleanup failure was reported. This is observed stability, not a guarantee of future non-flakiness.

The final local report represents **parallel-2**, with Playwright HTML at `reports/parallel-2/playwright/index.html` and Allure HTML at `reports/parallel-2/allure/index.html`. Allure and Playwright durations measure different intervals: Playwright includes runner startup/teardown, while Allure's interval spans individual test results. Counts are reconciled automatically. Per-run JSON evidence is in `evidence/*-summary.json`; combined machine-readable evidence is `docs/execution-summary.json`.

Clean `npm ci`, TypeScript, ESLint, Prettier, all scope commands, the pinned application installer and a separate SQLite process-restart persistence probe were executed. Final report rendering and credential checks are recorded in `docs/report-quality.md`.

GitHub Actions and Pages: successful. Hosted regression passed 72/72 with two workers on Node v24.22.2 and Playwright 1.65.1, with zero failures, skips or flaky results. [Verified hosted execution](https://github.com/srenevasanks/playwright-typescript-api-automation/actions/runs/44780473895). See [hosted validation](hosted-validation.md) for report verification and actual artifacts.
