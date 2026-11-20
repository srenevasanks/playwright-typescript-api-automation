# Feasibility validation

I selected **TaskDesk on PocketBase 0.40.6**, an open-source SQLite-backed API engine: https://github.com/pocketbase/pocketbase (MIT, attribution in `api-app/POCKETBASE-LICENSE.md`). TaskDesk is my controlled task/project application configuration, not an upstream sample application. Its executable and CRUD/authentication logic are unmodified PocketBase. The migration defines the domain independently of the test assertions.

The environment is Windows, Node 24.11.1, npm 11.18.0, Playwright 1.65.1. Docker is unavailable. The official Windows binary starts locally; the same release supplies a Linux amd64 binary for GitHub Actions. No database server, browser, or Java is required to run tests; Java 17 is required for Allure generation.

Before framework implementation I executed 13 real API checks, recorded in `evidence/feasibility.json`: health, registration, valid and invalid password authentication, project POST/GET/PATCH/DELETE, anonymous denial, related task creation/completion/deletion, and user cleanup. All passed. Initial sandboxed networking prevented requests; restarting the service and requests outside the sandbox resolved it. This was an environment setup issue, not an application defect.

## Verified contract and domain

- `GET /api/health`: 200 JSON.
- `POST /api/collections/members/records`: registration, 200 record.
- `POST /api/collections/members/auth-with-password`: 200 `{token,record}` or 400 structured error.
- `/api/collections/{projects,tasks}/records`: GET paginated list and POST create (200).
- `/api/collections/{projects,tasks}/records/{id}`: GET/PATCH (200), DELETE (204).
- JSON requests/responses; passwords use PocketBase hashing. Token is sent in Authorization.
- Editors own projects; tasks belong to projects. Viewers cannot create projects. Other users cannot view/update/delete owned resources. Lists are filtered to accessible records.
- Task writes require an active project. Archiving retains readable history and prevents further task mutation. Reopening allows editing again.
- State persists in `.cache/data/data.db` (SQLite), across process restarts. Each test creates its own random member and authenticates independently. Deleting that member cascades to its owned projects and tasks; no global deletion is needed.
- Controlled reset: stop the application and remove only this checkout's `.cache/data` directory, then restart to reapply migrations. Never do this against shared data.

Sources: https://pocketbase.io/docs/api-records/, https://pocketbase.io/docs/api-records/#auth-with-password, https://pocketbase.io/docs/api-rules-and-filters/, https://pocketbase.io/docs/collections/ and the checked-in migration. PocketBase uses PATCH, not PUT replacement; stateless logout is client-side token disposal. No server logout/revocation endpoint is invented. Expiry manipulation is outside scope. This application does not implement billing, notifications, or external integrations.
