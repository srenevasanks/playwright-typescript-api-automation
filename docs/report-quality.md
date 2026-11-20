# Final local report quality review

I reviewed the reports generated from the final **parallel-2** full regression, not a smoke run. The reports show 72 tests passed, zero failed, skipped or flaky, two workers, and an execution date of 20 November 2026. Exact UTC timestamps and durations are preserved in `evidence/parallel-2-summary.json`. Playwright's runner duration and Allure's test interval are intentionally different timing measures.

I opened both reports in the browser and checked the rendered dashboards, test navigation and readable test details. I inspected an authentication attachment with redacted password/token fields. After finding and fixing a diagnostic-label leak, I discarded affected reports, reran the suites and generated clean reports from fresh results. The final generator scans all Allure result files for raw JWTs and reconciles both reporters' counts. No HTML results were fabricated or manually altered.

`evidence/report-audit.json` records 551 report files fetched successfully over HTTP and checked byte-for-byte against the generated files. All 72 tests have Allure feature, story, severity and description metadata. CSS, JavaScript, JSON data, test details and attachments are present. Browser review confirmed styling and navigation; environment information identifies PocketBase, Node, scope and workers.

Final locations: `reports/parallel-2/playwright/` and `reports/parallel-2/allure/`. To serve these locally, set `RUN_ID=parallel-2` and run `node scripts/serve-reports.mjs` (PowerShell: `$env:RUN_ID='parallel-2'`). HTML is ignored by Git and uploaded as CI artifacts rather than tracked source.

The documented controlled reset removed one identity left by an intentionally interrupted diagnostic execution. A subsequent fresh-database smoke run passed 4/4 and left exactly zero members, projects and tasks; see `evidence/cleanup.json`. Completed regression fixtures reported no cleanup failures. This reset did not alter any expected application behavior or published execution result.

GitHub-hosted report verification is recorded separately after deployment. This review establishes the local pre-publication gate only.
