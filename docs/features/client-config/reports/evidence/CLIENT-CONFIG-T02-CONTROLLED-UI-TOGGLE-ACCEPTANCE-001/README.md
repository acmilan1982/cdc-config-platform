# CLIENT-CONFIG-T02-CONTROLLED-UI-TOGGLE-ACCEPTANCE-001 — evidence index

Task: `CLIENT-CONFIG-T02-CONTROLLED-UI-TOGGLE-ACCEPTANCE-001`
Base: `63bbbde57132a498b02a4d011295e5fc072f2408` (`develop`)
Scope: `/config/client`, alias **T02 only**, one real-page enable→disable round-trip.

## Files

| File | Content |
|---|---|
| `probe-ui-toggle.mjs` | Playwright-core controlled probe (network gate before first navigation, pre-image checks, B0–B7 steps, sanitized output). Reads the exact clientId from a repo-external mapping; contains no real ID. |
| `ui-toggle-results.json` | Sanitized run result: per-step observations, gate write list, timings, close-observer data, final state. Real ID replaced by `{T02}`. |
| `sql-window-extract.txt` | Desensitized backend SQL window (2026-11-03 13:59:09–13:59:27 CST) showing exactly two single-row `FG_ACTIVE` updates and no other writes. |
| `env-and-version.txt` | Commit/remote SHA, reused services, toolchain/browser, request gate and write budget, sensitive-data placement, execution boundaries, time base. |
| `element-plus-close-order.txt` | Installed Element Plus 2.14.2 `doClose`/`handleAction`/`onAction` excerpt that shows `visible=false` precedes the write request; recorded because `node_modules` is not versioned. |
| `SHA256SUMS.txt` | SHA-256 of the files above (excluding itself). |

## Key observed facts

- Pre-image: T02 `FG_ACTIVE='0'`, 1 associated source, no row/source anomaly or
  comma ambiguity; E2 self-exclusion returned the token present and selectable.
  A pre-run drift check re-read the same 9 fields and found 0 drift.
- Gate: exactly 2 write attempts (B3 `PUT .../enable`, B6 `PUT .../disable`),
  0 blocked non-GET requests, 0 recovery writes; total budget 2 of 3.
- Cancel legs B2/B5 produced no write request and no SQL update; state and fixed
  selection were unchanged.
- After B3 reload T02 became `'1'` (disable marker absent) and was reselected by
  its stable clientId; after B6 reload T02 returned to `'0'` (marker restored)
  and was reselected.
- B7 GET diff vs pre-image: business fields identical; only `fgActive`/`status`
  changed and were restored. Final `FG_ACTIVE='0'`, `status=DISABLED`.
- Backend SQL: 2 `UPDATE ... WHERE CLIENT_ID = ?` statements, each `Updates: 1`;
  list reloads are SELECT-only; aggregate list size stayed 16.

## Close-order caveat (recorded, not hidden)

The confirm dialog's close state transition (`visible=false` in Element Plus
`doClose`) is initiated synchronously on click, before the write request, and the
request is emitted on the following `nextTick`. The dialog's DOM/visibility
teardown completes about 220–240 ms later because of the standard leave
transition; the request therefore overlaps the fade-out. No in-dialog
loading/processing button state was observed. The full timing is in
`ui-toggle-results.json` (`B3`/`B6` `close_observer`, `click_at`, gate `at_iso`).

## Boundary

This bundle proves only what the observed page, request gate, and backend SQL
window show. It is not a database-level zero-write audit, not a CAS proof, and
not an authorization for any further write. The real mapping, pre-image, and raw
run log stay outside the repository (mode 600).
