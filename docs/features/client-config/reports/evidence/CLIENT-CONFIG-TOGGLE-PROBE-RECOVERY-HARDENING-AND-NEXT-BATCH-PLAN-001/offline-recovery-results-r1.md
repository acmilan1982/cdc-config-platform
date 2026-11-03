# Offline recovery simulation — R1 results

Task: `CLIENT-CONFIG-TOGGLE-PROBE-RECOVERY-HARDENING-AND-NEXT-BATCH-PLAN-001-R1`

This file records the **R1** offline run. The R0 run (`offline-recovery-results.md`,
17/17, exit 0) is preserved unchanged as a historical snapshot of the previous
commit's script; it was **not** produced by the R1 code.

## Command

```bash
cd docs/features/client-config/reports/evidence/CLIENT-CONFIG-TOGGLE-PROBE-RECOVERY-HARDENING-AND-NEXT-BATCH-PLAN-001
node --test offline-recovery.test.mjs
```

## Result

| Field | Value |
|---|---|
| Node | `v24.17.0` |
| Run at (UTC) | `2026-11-03T11:13:07Z` |
| tests | 40 |
| pass | 40 |
| fail | 0 |
| exit code | 0 |

Case count is reported from the run itself; it is not a pre-filled constant.

## Coverage added in R1

R1 routes every coordinator test through the **same** `readPageState()` module the
real probe imports, so the page-read failure behaviour under test is the real
implementation, not a test-only copy.

| R1 requirement | Cases | What is asserted |
|---|---|---|
| `evaluate` throws / page-context unavailable → unknown, API 0 | A1, A13 | `pageState.known=false`, `apiCalls===0`; a confirming read yields `RESTORED_BY_READ` with a limitation, still no write |
| `evaluate` non-boolean → unknown, API 0 | A2 | `PAGE_STATE_UNKNOWN` |
| `writeAllowed`/`inFlight` missing/null/non-boolean → stop, API 0 | A3 (5 variants) | `PAGE_STATE_UNKNOWN` |
| missing page-state adapter → not writable | A4 | constructor throws `requires getPageState()`; `null` also rejected |
| adapter returns undefined → unknown | A5 | `PAGE_STATE_UNKNOWN` |
| pageAttempt throws (send outcome unknown) → no API fallback | A6, A11 | `PAGE_ATTEMPT_FAILED`, `apiCalls===0`; A11 proves no resend even after the gate allowed a write |
| pageAttempt non-boolean `sent` | A7 | `PAGE_SEND_UNKNOWN`, `apiCalls===0` |
| in-flight / pending-confirm / already-allowed write at entry | A8, A9, A10 | `PAGE_IN_FLIGHT_OR_PENDING`, `apiCalls===0` |
| in-flight at entry but final read `'0'` | A18 | recovered via read with an honest `limitation`, no API |
| page-allowed write confirmed only by final read | S3 | `RECOVERED_VIA_PAGE` with `limitation` noting the gate did not inspect the response |
| explicit safe + page did not send → API fallback ≤1 | S2, A12 | `apiCalls===1`, one recovery reservation |
| page already allowed then UI error / in-flight / pending → no API resend | S3, S4, S8 | no API write; `PAGE_WROTE_UNCONFIRMED` where GET is not `'0'` |
| identity `identityOk`/`exact` missing or non-true → stop | A15 | `IDENTITY_UNKNOWN`, API 0 |
| `businessDrift` missing/malformed → stop | A16 | `BUSINESS_DRIFT_UNKNOWN`, API 0 |
| `readSnapshot` throws → unknown identity | A14 | `IDENTITY_UNKNOWN`, no ledger charge |
| real adapter semantics unit test | A17 | only known + all-false permits a switch |
| original budget / race / timeout / no-refund | S5, S6, S7, S9, L1 | unchanged behaviour still passes |
| already `'0'` with verified identity/drift | S1, S1b | no write; S1b records an honest limitation when the page could not be confirmed idle |

## Why these cases make the R0 behaviour fail

The R0 adapter set `pendingConfirm=false` when `page.evaluate` failed and fixed
`writeAllowed=false`, so an unavailable page looked safe and the API fallback
could run. The R1 cases A1/A2/A3/A5/A6/A7 all assert `apiCalls===0`; under the R0
adapter each would have returned a safe-looking state and reached `apiWrite()`.
A4 (constructor rejection) and A16 (`businessDrift` missing) also fail under R0's
"missing flag means true / no drift" handling. Assertions are on send counts,
ledger counts, stop reasons and final flags — not source-string matching.

## Boundary

Only Node built-ins and in-memory stubs: no network, browser, real business API,
SQL, database, ZooKeeper, Kafka or `sync-client`. **Passing offline does not prove
real fault recovery was exercised in a business environment**; this task ran no
real enable/disable, no fault injection and no product build/test.
