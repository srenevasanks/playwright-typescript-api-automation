# Coverage map

The suite has 72 distinct invocations. Tags overlap; this is scenario coverage, not measured source-line coverage of PocketBase.

| Area                             | Count | Evidence                                                                                                                              |
| -------------------------------- | ----: | ------------------------------------------------------------------------------------------------------------------------------------- |
| Authentication                   |    16 | Valid/invalid/missing credentials, registration validation and duplicates, token reuse and refresh                                    |
| Authorization                    |    10 | Role denial, anonymous denial, cross-owner GET/PATCH/DELETE, filtered lists, relation isolation, immutable ownership, role escalation |
| Boundary                         |    18 | Project title 2/3/80/81, task title 2/3/120/121, priority -1/0/1/5/6/large, notes 0/300/301, whitespace                               |
| Contract                         |     3 | Health, paginated arrays, nested project/owner expansion                                                                              |
| Functional                       |     8 | Project/task CRUD and persistence, filtering/sorting/pagination, task status enum, optional notes                                     |
| Additional negative              |    14 | Required/type/null/status errors, malformed JSON, missing records/relations, invalid filters, unsupported PUT                         |
| Workflow/integration source file |     3 | Completion/archive history, archive-block/reopen, cascade with unrelated project retained                                             |

Cross-cutting tags: smoke 4; negative 28; integration 4; business workflows 2. Authenticated clients and per-test owned-resource cleanup operate throughout. `evidence/persistence.json` covers process-restart persistence separately and is not added to the Playwright test count. Registration returns 200, deletion 204, validation and create-rule denial 400, invalid refresh 401, hidden records and unsupported routes 404. Tests assert body contracts and field/persistence semantics, not only status 200.

Not applicable: resource PUT, null domain responses, date-range rules, server logout or token-revocation endpoints. These are not implemented by this configured API and are not represented as skipped tests.
