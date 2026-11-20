# Hosted validation

I created the requested new public repository only after all local gates passed. The initial source commit is `5dd1bbe4b4b0c0ac7779823ab8d6cc632c6b138e`. I did not modify other repositories.

[The first hosted workflow](https://github.com/srenevasanks/playwright-typescript-api-automation/actions/runs/44780473895) completed successfully, including test and Pages deployment jobs. It ran on Ubuntu with Node v24.22.2 and Playwright 1.65.1. The hosted smoke suite passed 4/4; full regression passed 72/72 with two workers, zero failed/skipped/flaky and zero retries. The regression runner duration was 9.122 seconds. Persistence across process restart also passed. The actual regression summary is in `evidence/hosted-summary.json`, and job/step outcomes are in `evidence/hosted-workflow.json`.

The workflow installed dependencies and the SHA256-pinned Linux API binary, passed TypeScript/ESLint/Prettier, started the application with health readiness checks, executed both scopes, generated reports, checked counts and JWT redaction, uploaded artifacts and successfully deployed Pages. No browser was installed. No failure exit codes were ignored.

I opened both live reports, checked 72/72 passing dashboards and navigated into individual test details. Allure displayed descriptions, severity, steps and HTTP attachments, with the hosted Node version and two-worker environment. I downloaded the genuine `verified-report-site` artifact and compared all **553 published files** over HTTPS byte-for-byte with that artifact. The check passed; see `evidence/hosted-report-verification.json`. The 553 files comprise the report files plus the site landing page and execution summary (the `.nojekyll` control file is not fetched).

- [Repository](https://github.com/srenevasanks/playwright-typescript-api-automation)
- [Playwright HTML](https://srenevasanks.github.io/playwright-typescript-api-automation/playwright/)
- [Allure HTML](https://srenevasanks.github.io/playwright-typescript-api-automation/allure/)
- [Live machine-readable summary](https://srenevasanks.github.io/playwright-typescript-api-automation/summary.json)

The initial run passed but warned that older Actions releases were deprecated. I updated the workflows to verified current official release tags and retained this first-run evidence. Subsequent hosted executions deploy fresh results at the same URLs; use the live summary's `githubActions` field to identify the exact currently published run. Local stability evidence and hosted evidence remain separate.
