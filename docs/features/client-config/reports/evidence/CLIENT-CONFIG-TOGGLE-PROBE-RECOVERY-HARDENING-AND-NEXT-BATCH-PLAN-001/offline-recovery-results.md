# Offline recovery verification — results

- Task: `CLIENT-CONFIG-TOGGLE-PROBE-RECOVERY-HARDENING-AND-NEXT-BATCH-PLAN-001`
- Node: `v24.17.0`
- Run at (UTC): `2026-11-03T10:53:16Z`
- Working directory: `docs/features/client-config/reports/evidence/CLIENT-CONFIG-TOGGLE-PROBE-RECOVERY-HARDENING-AND-NEXT-BATCH-PLAN-001/`

## Command

```bash
cd /agent/cdc-config-platform/docs/features/client-config/reports/evidence/CLIENT-CONFIG-TOGGLE-PROBE-RECOVERY-HARDENING-AND-NEXT-BATCH-PLAN-001
node --test offline-recovery.test.mjs
```

Exit code: `0`

## Cases

| # | Case | Result |
|---|---|---|
| S1 | No recovery needed: already `0` → 0 writes | PASS |
| S2 | Page failed before sending; re-read still `1`, no drift, no in-flight; API fallback exactly once | PASS |
| S3 | Page recovery request allowed but UI then throws; GET `0`; no API resend | PASS |
| S4 | Page recovery allowed but result unknown / GET still `1` → stop, no blind resend | PASS |
| S5a | API timeout still consumes budget, not retried | PASS |
| S5b | API JSON parse-error still consumes budget, not retried | PASS |
| S5c | API disconnect still consumes budget, not retried | PASS |
| S6a | Unknown identity → no write | PASS |
| S6b | Business field drift → no write | PASS |
| S6c | Unknown state → no write | PASS |
| S6d | Recovery budget exhausted → no write | PASS |
| S7a | Page consumption blocks the API for the same recovery | PASS |
| S7b | Concurrent recoveries share one ledger: extra recovery max 1, total max 3 | PASS |
| S7c | Ledger total cap enforced across kinds | PASS |
| S8 | Page action completed but GET not confirming restore → not reported as success | PASS |
| S9 | Success path keeps normal enable1+disable1, recovery not executed | PASS |
| L1 | Ledger settle never refunds and refuses a double settle | PASS |

Totals: `tests 17 / pass 17 / fail 0 / cancelled 0 / skipped 0 / todo 0`, duration ~186 ms.

## Assertion basis

Assertions check actual API send-attempt counts, ledger counters (`counts`, `total`, `attempts`), settled outcomes, final action/reason, and `recovered` flags. They do not string-match source code or restate the implementation.

## Boundary

This run uses only Node built-ins (`node:test`, `node:assert/strict`) and in-memory stubs. It performs no network access, no browser launch, no real business API call, and no SQL write.

**Passing offline does NOT prove real fault recovery was exercised in a business environment.** The corrected probe has not been run against the real T02 page or API in this task, and this result must not be cited as real-environment recovery verification.
