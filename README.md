# Playwright TypeScript API Automation Framework

[![API tests](https://github.com/srenevasanks/playwright-typescript-api-automation/actions/workflows/api-tests.yml/badge.svg)](https://github.com/srenevasanks/playwright-typescript-api-automation/actions/workflows/api-tests.yml)

I built an API-only test framework for **TaskDesk**, a controlled project/task application configured on unmodified **PocketBase 0.40.6**. It uses real SQLite persistence, password authentication, editor/viewer access rules, project ownership, related tasks and archive/reopen workflows. I verified the application before building the framework. I do not use browsers to execute the test suite.

## Stack and structure

Node.js 24 LTS, npm, strict TypeScript, Playwright Test/APIRequestContext, Zod, ESLint, Prettier, Allure Playwright, Playwright HTML, GitHub Actions and Pages. Java 17 is needed only to generate Allure HTML. Windows x64 and Linux x64 installation are supported; Docker is unnecessary.

- `api-app/`: TaskDesk migrations, OpenAPI contract and upstream attribution.
- `src/api/clients/`: explicit Auth, Projects and Tasks clients.
- `src/api/core/`: native Playwright transport with redacted request/response attachments.
- `src/api/schemas/`: response contracts and inferred TypeScript types.
- `src/api/factories/`, `fixtures/`: random data and independent actor lifecycle.
- `tests/`: tagged scenarios; each invocation belongs to one source test, even when it has multiple tags.
- `scripts/`: installation, execution, reporting, persistence verification and publication gates.
- `evidence/`: compact actual run summaries. Generated HTML, databases, binaries and dependencies are ignored by Git.

The [architecture diagram](docs/architecture.md) shows the actual component boundaries. The application enforces the rules; the framework observes and asserts them.

## Run locally

```bash
npm ci
npm run app:install
npm run typecheck
npm run lint
npm run format:check
npm run test:smoke
npm run test:regression
npm run test:report
node scripts/serve-reports.mjs
```

Playwright starts the API and waits for a real `/api/health` response automatically. For interactive API work, `npm run app:start` starts it explicitly. `npm run feasibility` requires that running service. Open the locally served reports at `http://127.0.0.1:9323/playwright/` and `http://127.0.0.1:9323/allure/`. Allure must be served over HTTP; opening its file directly can prevent data loading.

| Scope           | Verified command              | Invocations |
| --------------- | ----------------------------- | ----------: |
| Smoke           | `npm run test:smoke`          |           4 |
| Functional      | `npm run test:functional`     |           8 |
| Negative        | `npm run test:negative`       |          28 |
| Boundary        | `npm run test:boundary`       |          18 |
| Contract        | `npm run test:contract`       |           3 |
| Authentication  | `npm run test:authentication` |          16 |
| Authorization   | `npm run test:authorization`  |          10 |
| Integration     | `npm run test:integration`    |           4 |
| API workflows   | `npm run test:workflows`      |           2 |
| Full regression | `npm run test:regression`     |          72 |

Scope counts overlap because tags describe coverage, rather than duplicated tests. Each scope writes its own report folder. Set `RUN_ID` to retain several executions of one scope. Default workers: one, retries: zero.

Two-worker execution (PowerShell):

```powershell
$env:WORKERS = '2'
$env:RUN_ID = 'my-parallel-run'
npm run test:regression
npm run test:report
Remove-Item Env:WORKERS, Env:RUN_ID
```

For Bash: `WORKERS=2 RUN_ID=my-parallel-run npm run test:regression`, followed by `RUN_ID=my-parallel-run npm run test:report`.

## Coverage and workflows

I cover three API service areas: member authentication/profile access, projects and tasks. Coverage includes CRUD, partial updates, read-after-write persistence, sorting, filtering, pagination, validation errors, malformed input, boundary values, duplicate identity, token reuse/refresh, missing/invalid tokens, role restrictions, ownership isolation, expanded relationships and cascading deletion.

The first workflow creates a project and related task, progresses through doing/done, archives the project and reads retained history. The second archives an active task's project, verifies mutations are blocked, reopens it and verifies editing resumes. These exercise real application rules.

I derive contracts from [PocketBase's API reference](https://pocketbase.io/docs/api-records/), [access-rule documentation](https://pocketbase.io/docs/api-rules-and-filters/), the pinned source and the checked-in migration. `api-app/openapi.json` documents the exposed TaskDesk surface. Zod validates required fields, enumerations, arrays, expanded nested relationships and structured errors. Optional domain text defaults to empty strings; no nullable domain fields exist.

## Data, authentication and cleanup

Each actor gets its own API context, synthetic email and random password generated in memory. No valid credentials or tokens are committed. The member's token is scoped to its own records. Fixture teardown deletes only that member, cascading through owned projects and tasks. Cleanup failures fail the fixture and attach diagnostics. The database remains persistent between runs, while test identities remain independent.

To reset a controlled checkout, stop its API and delete only its `.cache/data` directory, then restart to reapply migrations. Do not point these tests at production or a shared database. `node scripts/persistence.mjs` separately verifies that data survives a full process restart on port 8091.

## Reports and CI

The workflow runs clean installation, a checksum-pinned API download, static checks, smoke, two-worker regression and a persistence restart check. It generates both report formats, checks real counts and uploads artifacts. Only a successful main-branch run can deploy to Pages; failure exit codes are preserved. Pull requests test without publishing. There is no browser installation and no `continue-on-error`.

- [Playwright HTML](https://srenevasanks.github.io/playwright-typescript-api-automation/playwright/)
- [Allure HTML](https://srenevasanks.github.io/playwright-typescript-api-automation/allure/)
- [GitHub Actions](https://github.com/srenevasanks/playwright-typescript-api-automation/actions/workflows/api-tests.yml)

Each report includes readable steps and redacted HTTP evidence. Playwright JSON and `summary.json` record actual scope, timing, runtime and worker count. Allure records features, stories, severity, descriptions and environment metadata. Trend history is not retained between deployments.

## Results and limitations

The [execution summary](docs/execution-summary.md) records actual local and hosted evidence. The initial run exposed two incorrect assumptions in tests; I corrected them using authoritative pinned source, preserving the original failure summary. See [investigation details](docs/known-issues.md), [coverage](docs/test-coverage.md), [test strategy](docs/test-strategy.md) and [feasibility checks](docs/feasibility-validation.md).

TaskDesk is my application configuration on an established engine, not an upstream ready-made product. PocketBase deliberately hides denied records with 404 and filters inaccessible lists to empty results. Whitespace counts toward string length. Unsupported PUT returns 404. Stateless authentication has no server logout endpoint; expiry fabrication is not tested. Viewer assignment, email delivery, billing and load testing are outside the implemented scope. Future work could add viewer project assignments and retained Allure history; neither is claimed here.

I used OpenAI Codex assistance. PocketBase attribution and dependency licenses are preserved; see [NOTICE](NOTICE.md) and [LICENSE](LICENSE).
