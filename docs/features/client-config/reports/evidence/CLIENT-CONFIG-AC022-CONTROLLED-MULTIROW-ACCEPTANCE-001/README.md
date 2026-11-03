# CLIENT-CONFIG-AC022-CONTROLLED-MULTIROW-ACCEPTANCE-001 — evidence index

Task: `CLIENT-CONFIG-AC022-CONTROLLED-MULTIROW-ACCEPTANCE-001`
Base: `1e72e4e39c01ea136cd7e0f3dcf6504a4de6939b` (`develop`)
Scope: `/config/client`, `CCFG-AC-022`. One original authorized object (report alias
**OWNER_TEST_B** = original readiness mapping T02) enabled once, observed at two
viewports, then disabled once and restored.

## Files

| File | Content |
|---|---|
| `verify-preconditions.mjs` | GET-only precondition check (exact `'0'`, business pre-image drift, E1 row/source anomalies & conflicts, E2 self-exclusion presence/selectability). No write branch. |
| `precondition-T02.json` | Sanitized result of that check (counts, token aliases `S01`, booleans only; no real ID/desc/token). |
| `probe-ac022-multirow.mjs` | Main controlled probe: context gate before first navigation, real-page menu → secondary confirm, one enable + one disable, two-viewport multi-row observations, reviewed recovery integration, sanitized output. |
| `AC022-multirow-results.json` | Sanitized run result. Real ID → `{T02}`; other rows → `{ROW}`; data-source tokens → `{DS}`. |
| `env-and-version.txt` | SHAs, service PIDs/listeners, toolchain/browser, identity source, write budget, time base, boundaries. |
| `SHA256SUMS` | SHA-256 of the files above (excluding itself and the temporary `node_modules` symlink). |

## How the probe was run

```bash
# from this directory, with playwright-core resolvable (gitignored symlink used during the run)
ln -s /root/.hermes/hermes-agent/node_modules node_modules
node probe-ac022-multirow.mjs
rm node_modules
```

The probe reads the exact clientId from the repo-external readiness mapping and writes
raw output outside the repository (mode 600). It contains no real ID.

## Key observed facts

- B0 snapshot: 16 rows, `FG_ACTIVE='1'` = 1, `'0'` = 15, other = 0. Target was exact
  `'0'`/`DISABLED` with 1 source, zero business drift, no E1 anomaly/conflict, and E2
  self-exclusion present & selectable.
- Pre-enable: two different disabled rows each showed menu `[启用, 删除]`, opened the
  enable confirm (`启用探针`, buttons `取消/启用`) and cancelled — 0 writes each.
- Enable: real menu → confirm → one primary click; exactly 1 `PUT .../enable` (HTTP 200),
  list reload 200, target marker disappeared.
- Same-instant post-enable snapshot: 2 enabled / 14 disabled at 1440×900 and 1920×1080;
  0 marker-vs-GET mismatches; no “状态” column; rightmost “操作” column `position: sticky`,
  `right: 0px`; no inline 启用/停用 text controls; enabled rows show `[停用, 删除]`, disabled
  rows `[启用, 删除]`. Confirm+cancel on multiple disabled rows (and on the enabled target
  for 停用) produced 0 writes.
- Post-enable GET diff vs pre-image: only `fgActive`/`status` changed; all business
  fields identical.
- Disable: real menu → confirm → one primary click; exactly 1 `PUT .../disable` (HTTP 200),
  reload 200, marker restored. Final GET: `fgActive='0'`, `status=DISABLED`, zero diff vs
  pre-image → original business state restored.
- Gate: 2 write attempts total (enable 1, disable 1, recovery 0); total budget 3, used 2,
  remaining 1; 0 blocked non-GET; the 1920×1080 context had 0 write attempts.

## Boundary

This bundle proves only what the observed page, the context-level request gate, and the
final GET show. It is **not** a database-level zero-write audit, not an API-CAS proof,
not an external-process-isolation proof, and not an authorization for any further write.
The real mapping, pre-image, and raw run summary stay outside the repository (mode 600).

`CCFG-AC-022` remains `BLOCKED`: this round removed the "only one enabled row" evidence
gap by producing a real same-instant 2-enabled/14-disabled snapshot and re-running the
success-state leg, but the acceptance precondition's quantity wording “各若干条” still has
no owner-approved threshold. Whether that may be read as satisfied by multiple rows is a
definition/approval question, not a further evidence question.
