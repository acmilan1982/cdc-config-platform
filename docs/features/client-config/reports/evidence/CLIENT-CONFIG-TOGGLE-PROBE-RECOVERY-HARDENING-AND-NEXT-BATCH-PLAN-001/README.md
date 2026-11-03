# Evidence — recovery-branch hardening (future use)

Task: `CLIENT-CONFIG-TOGGLE-PROBE-RECOVERY-HARDENING-AND-NEXT-BATCH-PLAN-001`

## What this directory is (and is not)

This directory contains a **hardened, future-use** version of the T02 controlled
toggle probe plus a pure-offline simulation of its recovery logic.

It did **not** produce the original T02 acceptance JSON. The original collection
lives, byte-identical and untouched, at:

```
../CLIENT-CONFIG-T02-CONTROLLED-UI-TOGGLE-ACCEPTANCE-001/
  probe-ui-toggle.mjs
  *.json / *.sql / SHA256SUMS
```

Do **not** replace or masquerade the historical probe/JSON with files from this
directory. The original `probe-ui-toggle.mjs` remains the script that collected
the historical evidence; its results are already remotely reviewed and must not
be re-attributed to the hardened copy.

## Future reuse

When a future task needs to re-run a bounded T02 UI enable→disable round-trip
with fault-safe recovery, it should use the hardened copy:

- `probe-ui-toggle.hardened.mjs` — same B0–B7 business steps as the original,
  but all write accounting goes through the shared ledger and the recovery
  branch delegates to the coordinator.
- `recovery-coordinator.mjs` — the single shared module used by both the real
  probe and the offline test. It has **no import side effects**: it does not
  start a browser, read the mapping/pre-image, or open a network connection.

Applicability conditions for reuse:

1. The future task prompt must explicitly declare the exact target alias/clients,
   the write operations, the budget, and the recovery boundary.
2. The dedicated test object authorization referenced by the owner must still be
   in force for that target; the hardened script reads the real client ID from
   the external mapping at runtime and must never hardcode a business ID.
3. The real mapping/pre-image files stay outside the repository with mode 600;
   only desensitized JSON may be committed.
4. Running the real probe requires a separate, explicitly authorized execution
   task. **This task did not run it.**

## Write ledger (shared budget)

One ledger per run, created by `createWriteLedger()`:

| Kind | Cap | Meaning |
|---|---|---|
| `enable` | 1 | normal enable (B3) |
| `disable` | 1 | normal disable (B6) |
| `recovery-disable` | 1 | extra recovery disable |
| `total` | 3 | all channels combined |

Semantics:

- `tryReserve(kind, meta)` is **synchronous**: it checks and increments in one
  call, so concurrent callers cannot split check/reserve and overrun.
- The attempt is charged **before** the request is allowed to leave, not after
  the HTTP response or JSON parse.
- `settle(reservation, outcome, detail)` records success / `http-error` /
  `timeout` / `disconnect` / `parse-error` / `unknown` **after** the fact. It
  never refunds. An attempt left as `reserved` means "allowed, result unknown".
- Reads (GET/HEAD/OPTIONS) never reserve.
- The browser gate and the API recovery both use this same ledger. A recovery
  write already allowed by the page gate consumes the single recovery slot, so
  the API cannot send a second extra recovery request.

## Recovery coordinator

`createRecoveryCoordinator({ ledger, readSnapshot, pageAttempt, apiWrite,
getPageState, ... })` encodes the decision order:

1. unknown identity → stop, no write;
2. already `'0'` → `ALREADY_RESTORED`, no write (business drift still stops);
3. state not exactly `'1'` → stop;
4. business pre-image drift → stop;
5. a page write is allowed / in flight / a confirm is pending → re-read only,
   never send API; report `PAGE_IN_FLIGHT_OR_PENDING` if still not restored;
6. optional page attempt: if it **actually allowed a write**, re-read and never
   resend through the API (`PAGE_WROTE_UNCONFIRMED` when GET is not `'0'`);
7. if the page failed **before** sending, re-read identity/`FG_ACTIVE`/drift and
   re-check page state;
8. only then reserve the single recovery budget synchronously and call
   `apiWrite()` exactly once;
9. recovery success is claimed **only** by a final read that matches the
   original business pre-image with `FG_ACTIVE='0'`. Click completion or HTTP
   200 alone never sets `recovered=true`.

`readSnapshot()` must return a normalized object:
`{ identityOk, exact, fgActive, businessDrift: string[], raw }`.

## Real probe integration points

`probe-ui-toggle.hardened.mjs` integrates the module at exactly three places:

1. `ledger.tryReserve(d.kind, ...)` inside the context gate, before
   `route.continue()`; a failed reservation aborts the request like a phase
   block. Browser-gate writes stay `reserved` in the ledger because the gate
   forwards requests without inspecting responses (allowed / result-unknown).
2. `createRecoveryCoordinator(...).recover()` in the top-level catch; its
   adapters are `captureCurrent()`+`compareRows()` (read), the page's own
   menu/confirm click (page attempt), and an `AbortController`-bounded
   `fetch` (API write).
3. `ledger.snapshot()` exported in the run summary under
   `gate.write_ledger`.

A `disable_outstanding` flag is set when a normal disable is allowed and cleared
when its response returns; recovery treats an outstanding normal disable as
in-flight and will not auto-resend.

## Offline verification

```bash
cd docs/features/client-config/reports/evidence/CLIENT-CONFIG-TOGGLE-PROBE-RECOVERY-HARDENING-AND-NEXT-BATCH-PLAN-001
node --test offline-recovery.test.mjs
```

Result: **17/17 pass, exit code 0**. See `offline-recovery-results.md` for the
case table, command, exit code and boundary.

## Boundary

Offline simulation uses only Node built-ins and in-memory stubs: no network, no
browser, no real business API, no SQL. **Passing offline does not prove real
fault recovery was exercised in a business environment**, and this task did not
run the real probe or perform any business write.
