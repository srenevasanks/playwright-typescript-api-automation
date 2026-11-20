# Test strategy

I establish expectations from the TaskDesk migration and pinned PocketBase source and API documentation, rather than deriving schemas from a single response. Tests cover each applicable resource operation and verify persisted values with additional reads. PATCH is supported; PUT replacement is deliberately rejected. Titles need character lengths, not trimmed non-whitespace content. Project titles need not be unique; member email identities must be unique.

Each actor uses a random synthetic identity and cryptographically random password held only in memory. Each test owns independent API contexts and resources. Teardown deletes members, cascading through projects and tasks, and reports failures. If registration succeeds but login fails, the fixture explicitly records the orphan member ID and requires controlled reset rather than hiding the problem. Parallel workers share SQLite but never identities or owned records. No sleep is used to coordinate test data.

Validation order: feasibility; install and static checks; smoke; full suite; fix confirmed issues and rerun affected scopes; full suite; three further one-worker runs; two two-worker runs; final report verification. I preserve compact evidence per run. This demonstrates observed repeatability, not proof of absence of future flakiness.

Contract sources: https://pocketbase.io/docs/api-records/, https://pocketbase.io/docs/api-rules-and-filters/, and https://github.com/pocketbase/pocketbase/tree/v0.40.6/core. Schemas allow forward-compatible additional metadata but validate all required domain fields and nested expansion objects. The error contract validates status, message and structured field details. None of this project requires production credentials.
