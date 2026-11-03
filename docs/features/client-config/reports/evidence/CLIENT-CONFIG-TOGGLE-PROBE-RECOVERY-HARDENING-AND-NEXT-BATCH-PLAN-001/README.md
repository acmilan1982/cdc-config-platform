# Evidence — recovery-branch hardening (future use)

Task: `CLIENT-CONFIG-TOGGLE-PROBE-RECOVERY-HARDENING-AND-NEXT-BATCH-PLAN-001`
Follow-up: `CLIENT-CONFIG-TOGGLE-PROBE-RECOVERY-HARDENING-AND-NEXT-BATCH-PLAN-001-R1`

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
  branch delegates to the coordinator. It imports the page-state adapter below
  rather than reading page state inline.
- `recovery-coordinator.mjs` — the single shared module used by both the real
  probe and the offline test. It has **no import side effects**: it does not
  start a browser, read the mapping/pre-image, or open a network connection.
- `page-state-adapter.mjs` — the single fail-closed page-state reader used by
  both the real probe and the offline tests. It has **no import side effects**.

### R1 correction (fail-closed recovery)

The R0 review found a fail-open path: when `page.evaluate` failed, the adapter
set `pendingConfirm=false`, and `writeAllowed` was a fixed `false`, so an
unavailable page looked safe and the API fallback could run. R1 corrects this:

- `readPageState()` returns an explicit `{ known, ... }` envelope. A read error,
  an unavailable page/context, a missing field, or a non-boolean value yields
  `{ known: false, reason }` — never a safe-looking `false`.
- `writeAllowed`/`inFlight` are derived from the shared ledger and the real
  request lifecycle, not hardcoded. `writeAllowed` means a page-gate write was
  allowed with an unconfirmed result; `inFlight` means a write is genuinely
  outstanding.
- The coordinator requires an explicit `getPageState()` adapter (missing →
  constructor throws) and only considers a page→API switch when the state is
  `known` and all three flags are exactly `false`.
- Identity safety requires `identityOk===true && exact===true`; business safety
  requires an explicit `businessDrift` array. Missing/malformed values stop
  recovery instead of being read as safe.
- A thrown `pageAttempt` or a non-boolean `sent` is "unknown", so the API cannot
  be used as a fallback; once the page allowed a write, the API is never resent.


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

1. unknown/absent identity (`identityOk!==true` or `exact!==true`) → stop, no
   write; a missing/malformed `businessDrift` → `BUSINESS_DRIFT_UNKNOWN`, stop;
2. already `'0'` → `ALREADY_RESTORED`, no write (business drift still stops;
   when the page cannot be confirmed idle a `limitation` is recorded, and an
   in-flight request is not claimed to have safely ended);
3. state not exactly `'1'` → stop;
4. business pre-image drift → stop;
5. page state unknown (`{ known:false }`) → re-read only; a confirming `'0'`
   yields `RESTORED_BY_READ` with a limitation, otherwise `PAGE_STATE_UNKNOWN` —
   the API is never used;
6. page state known but a write is allowed / in flight / a confirm is pending →
   re-read only; `PAGE_IN_FLIGHT_OR_PENDING` if still not restored;
7. optional page attempt: a throw or non-boolean `sent` is unknown → stop
   (`PAGE_ATTEMPT_FAILED` / `PAGE_SEND_UNKNOWN`), never an API fallback; if it
   **actually allowed a write**, re-read and never resend through the API
   (`PAGE_WROTE_UNCONFIRMED` when GET is not `'0'`);
8. if the page explicitly did **not** send, re-read identity/`FG_ACTIVE`/drift
   and re-check page state; unknown still stops;
9. only then reserve the single recovery budget synchronously and call
   `apiWrite()` exactly once;
10. recovery success is claimed **only** by a final read that matches the
    original business pre-image with `FG_ACTIVE='0'`. Click completion or HTTP
    200 alone never sets `recovered=true`.

`readSnapshot()` must return a normalized object:
`{ identityOk, exact, fgActive, businessDrift: string[], raw }`. The coordinator
treats `identityOk`/`exact` as true only when explicitly `true`, and requires
`businessDrift` to be an array; anything else is unknown.

`getPageState()` is mandatory and must return the envelope from
`readPageState()`: `{ known: true, writeAllowed, inFlight, pendingConfirm }` or
`{ known: false, reason, detail }`.

## Real probe integration points

`probe-ui-toggle.hardened.mjs` integrates the modules at these places:

1. `ledger.tryReserve(d.kind, ...)` inside the context gate, before
   `route.continue()`; a failed reservation aborts the request like a phase
   block. Browser-gate writes stay `reserved` in the ledger because the gate
   forwards requests without inspecting responses (allowed / result-unknown).
2. `createRecoveryCoordinator(...).recover()` in the top-level catch; its
   adapters are `captureCurrent()`+`compareRows()` (read), the page's own
   menu/confirm click (page attempt), and an `AbortController`-bounded
   `fetch` (API write).
3. `getPageState: () => readPageState({ evaluate, lifecycle })`: `evaluate`
   reads only the confirm-dialog state from `page.evaluate`; `lifecycle` derives
   `writeAllowed` from a `recovery-disable` ledger entry and `inFlight` from
   `run.disable_outstanding` or an unsettled recovery reservation.
4. `apiWrite()` records its `run.write_attempts` entry **before** the request
   leaves, so a timeout/disconnect/parse failure is still counted and the
   summary cannot under-report a write as zero.
5. `ledger.snapshot()` exported in the run summary under
   `gate.write_ledger`.

A `disable_outstanding` flag is set when a normal disable is allowed and cleared
when its response returns; recovery treats an outstanding normal disable as
in-flight and will not auto-resend.

## Offline verification

```bash
cd docs/features/client-config/reports/evidence/CLIENT-CONFIG-TOGGLE-PROBE-RECOVERY-HARDENING-AND-NEXT-BATCH-PLAN-001
node --test offline-recovery.test.mjs
```

Result (R1 code): **40/40 pass, exit code 0**. See `offline-recovery-results-r1.md`
for the R1 case table, command, exit code and boundary.

`offline-recovery-results.md` (R0, 17/17) is a **historical snapshot** of the
previous commit's script and is kept unchanged; it was not produced by the R1
code, whose case count and coverage differ.

## Boundary

Offline simulation uses only Node built-ins and in-memory stubs: no network, no
browser, no real business API, no SQL. **Passing offline does not prove real
fault recovery was exercised in a business environment**, and this task did not
run the real probe or perform any business write.
