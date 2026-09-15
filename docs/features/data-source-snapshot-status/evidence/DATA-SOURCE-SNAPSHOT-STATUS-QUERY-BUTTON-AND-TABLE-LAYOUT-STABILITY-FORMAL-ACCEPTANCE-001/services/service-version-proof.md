# Service version proof (prompt §6)

Purpose: prove that the browser acceptance in `../browser/` ran against THIS worktree at the frozen base
commit — not against the pre-existing stale instances that were shut down at task start — and that the
running frontend/backend contain zero drift from the base commit.

All reading below is read-only. No service was restarted for this proof.

## 1. Worktree identity

```text
worktree            = /agent/dss-query-button-table-layout-formal-acceptance-001
HEAD                = 682650058b85b99b13a343373d6887bf0784ec1f
expected base       = 682650058b85b99b13a343373d6887bf0784ec1f
detached            = TRUE (isolation worktree, commits land here then fast-forward to develop)
pre-run tree state  = clean (only the new evidence directory untracked)
```

## 2. Running processes (this session's PIDs only)

```text
backend  pid 112346  0.0.0.0:8080   cwd = <worktree>/backend
         java -jar target/cdc-config-platform-backend-1.0.0-SNAPSHOT.jar --server.port=8080
frontend pid 112421  npm run dev --host 0.0.0.0 --port 5173 --strictPort   cwd = <worktree>/frontend
         pid 112435  node <worktree>/frontend/node_modules/.bin/vite --host 0.0.0.0 --port 5173
```

Listener ownership (`ss -ltnp`):

```text
LISTEN 0.0.0.0:5173  users:(("MainThread",pid=112435,fd=19))
LISTEN *:8080        users:(("java",pid=112346,fd=23))
```

Both processes' working directories are inside this task worktree, so neither can be serving the
pre-existing instance's code.

## 3. Frontend byte fingerprint — the dev server serves the base bytes

Each file was requested from the live Vite dev server via its `?raw` module (which returns the file's
verbatim bytes as a JS string), decoded, and hashed. `served == disk` proves the dev server is reading
this worktree's file, not a cached or stale copy. `disk == base` proves zero drift from the base commit.

| file | served == disk | disk == base | bytes |
|---|---|---|---|
| `src/layouts/MainLayout.vue` | TRUE | TRUE | 2321 |
| `src/views/data-source-run-state/DataSourceRunStatePage.vue` | TRUE | TRUE | 7903 |
| `src/views/data-source-run-state/composables/useDataSourceSnapshot.ts` | TRUE | TRUE | 12488 |
| `src/views/data-source-run-state/components/DataSourceSnapshotQueryBar.vue` | TRUE | TRUE | 26563 |
| `src/views/data-source-run-state/components/DataSourceSnapshotTable.vue` | TRUE | TRUE | 11726 |
| `src/views/data-source-run-state/components/DataSourceSnapshotToolbar.vue` | TRUE | TRUE | 11118 |

## 4. Whole-tree frontend/backend drift

See `../git/freeze-and-scope.md`: `git diff 6826500 -- frontend backend` is empty, so every frontend and
backend file — not just the six sampled above — is byte-identical to the base commit.

## 5. Backend artefact provenance

The jar under `<worktree>/backend/target/` was produced by this session's
`mvn -B clean package -DskipTests` (see `backend-build.log` in the task log directory) executed with the
worktree as the Maven project root, so its compiled classes derive from this worktree's sources at the
base commit.

## Verdict

```text
service_version_proof_status=PROVEN_RUNNING_TASK_WORKTREE_AT_BASE_COMMIT
frontend_served_bytes_equal_base=TRUE
backend_process_defined_by_task_build=TRUE
stale_instance_reuse=FALSE
```
