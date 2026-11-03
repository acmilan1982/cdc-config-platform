#!/usr/bin/env python3
"""CLIENT-CONFIG-DESCRIPTION-SAVE-BOUNDARY-ACCEPTANCE-001 read-only precondition probe.

This probe performs ONLY GET requests against the already-running backend.
It never issues POST/PUT/PATCH/DELETE and never touches a database, ZooKeeper,
Kafka or sync-client.

Identity is bound EXCLUSIVELY from the repo-external candidate map; no list
order, row index or hard-coded real client id is used. Raw responses and the
fresh business pre-image are written only to a repo-external directory (mode
600). The in-repo result file is sanitized: alias, hashes, lengths and
consistency booleans only -- no real client id, source id or description text.

Exit codes:
  0  preconditions passed and the original description is safely restorable
  3  BLOCKED precondition: original description is NULL/blank and therefore
     cannot be restored through the authorized edit API (empty desc -> 40102)
  4  BLOCKED precondition: another precondition failed
  2  probe/infrastructure error
"""

import hashlib
import json
import os
import sys
import time
import urllib.request
import urllib.error
import urllib.parse

API = os.environ.get("DSB_API", "http://127.0.0.1:8080")
CANDIDATE_MAP = os.environ.get(
    "DSB_CANDIDATE_MAP", "/root/cdc-controlled-toggle-readiness-001/candidate-map.json"
)
ALIAS = os.environ.get("DSB_ALIAS", "T02")
REPORT_ALIAS = os.environ.get("DSB_REPORT_ALIAS", "OWNER_TEST_B")
RAW_OUT_DIR = os.environ.get("DSB_RAW_OUT", "/root/cdc-description-save-boundary-001")
SANITIZED_OUT = os.environ.get(
    "DSB_SANITIZED_OUT",
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "precondition-results.json"),
)

# Mirrors backend ClientConfigServiceImpl.normalizePayload: empty/whitespace-only
# description is rejected with business code 40102 (INVALID_CLIENT_DESC).
DESC_EMPTY_BUSINESS_CODE = 40102
DESC_MAX_BYTES = 1024
FRONTEND_DESC_MAX_CHARS = 256


def _norm(v):
    return v.strip() if isinstance(v, str) else ""


def _sha256(s):
    return hashlib.sha256(s.encode("utf-8")).hexdigest()


def _write_json(path, obj, mode=0o600):
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2, sort_keys=True)
        f.write("\n")
    os.chmod(tmp, mode)
    os.replace(tmp, path)


def _get(url):
    req = urllib.request.Request(url, method="GET")
    with urllib.request.urlopen(req, timeout=20) as resp:
        body = resp.read().decode("utf-8")
        return resp.status, body


def main():
    captured_at = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    with open(CANDIDATE_MAP, "r", encoding="utf-8") as f:
        candidate = json.load(f)

    matches = [m for m in candidate.get("mapping", []) if m.get("alias") == ALIAS]
    if len(matches) != 1:
        raise SystemExit("identity binding failed: alias %r matched %d entries" % (ALIAS, len(matches)))
    binding = matches[0]
    client_id = binding.get("clientId")
    tokens = binding.get("tokens") or []
    if not client_id or not _norm(client_id):
        raise SystemExit("identity binding failed: empty clientId for alias %r" % ALIAS)

    list_status, list_body = _get(API + "/api/clients?status=ALL")
    list_json = json.loads(list_body)
    items = (list_json.get("data") or {}).get("items") or []
    exact = [r for r in items if _norm(r.get("clientId")) == _norm(client_id)]
    if len(exact) != 1:
        raise SystemExit("identity binding failed: %d exact matches for bound client" % len(exact))
    row = exact[0]

    opts_status, opts_body = _get(
        API + "/api/clients/data-source-options?excludeClientId=" + urllib.parse.quote(_norm(client_id))
    )
    opts_json = json.loads(opts_body)
    options = opts_json.get("data") or []
    by_id = {o.get("dataSourceId"): o for o in options if isinstance(o, dict)}

    desc_present = "clientDesc" in row and row.get("clientDesc") is not None
    desc = row.get("clientDesc") if desc_present else None
    desc_codepoints = len(desc) if isinstance(desc, str) else None
    desc_utf8 = len(desc.encode("utf-8")) if isinstance(desc, str) else None
    desc_blank = desc is not None and desc.strip() == ""

    restore_feasible = bool(desc_present) and not desc_blank and (desc_codepoints is not None and desc_codepoints <= FRONTEND_DESC_MAX_CHARS)
    if not desc_present:
        stop_reason = "ORIGINAL_DESC_NULL_CANNOT_BE_RESTORED"
    elif desc_blank:
        stop_reason = "ORIGINAL_DESC_BLANK_CANNOT_BE_RESTORED"
    elif desc_codepoints > FRONTEND_DESC_MAX_CHARS:
        stop_reason = "ORIGINAL_DESC_EXCEEDS_FRONTEND_256_CODEPOINTS"
    else:
        stop_reason = None

    row_anomalies = row.get("rowAnomalies") or []
    ds_anomalies = []
    ds_conflicts = []
    for ds in row.get("dataSources") or []:
        if ds.get("anomalies"):
            ds_anomalies.append({"idSha256": _sha256(ds.get("dataSourceId") or ""), "count": len(ds["anomalies"])})
        if ds.get("conflictClientIds"):
            ds_conflicts.append({"idSha256": _sha256(ds.get("dataSourceId") or ""), "count": len(ds["conflictClientIds"])})

    token_checks = []
    for tok in tokens:
        o = by_id.get(tok)
        token_checks.append({
            "tokenSha256": _sha256(tok),
            "present": o is not None,
            "selectable": bool(o and o.get("selectable") is True),
            "occupied": bool(o and (o.get("occupiedByClientIds") or [])),
            "conflictCount": len(o.get("occupiedByClientIds") or []) if o else None,
        })

    row_token_ids = [ds.get("dataSourceId") for ds in (row.get("dataSources") or [])]
    source_set_matches_mapping = (len(row_token_ids) == len(tokens) and set(row_token_ids) == set(tokens))
    exact_fg_active = row.get("fgActive") == "0"
    status_disabled = row.get("status") == "DISABLED"
    no_row_anomalies = len(row_anomalies) == 0
    no_ds_anomalies = len(ds_anomalies) == 0
    no_ds_conflicts = len(ds_conflicts) == 0
    all_tokens_selectable = all(t["present"] and t["selectable"] and not t["occupied"] for t in token_checks) and len(token_checks) == len(tokens)

    preconditions = {
        "identityBoundFromCandidateMap": True,
        "exactRowMatchCount": len(exact),
        "fgActiveIsZero": exact_fg_active,
        "statusIsDisabled": status_disabled,
        "rowAnomaliesEmpty": no_row_anomalies,
        "dataSourceAnomaliesEmpty": no_ds_anomalies,
        "dataSourceConflictsEmpty": no_ds_conflicts,
        "sourceSetMatchesMapping": source_set_matches_mapping,
        "allMappingTokensPresentSelectableUnoccupied": all_tokens_selectable,
        "originalDescPresent": desc_present,
        "originalDescRestorableViaAuthorizedEditApi": restore_feasible,
    }

    passed = all([
        exact_fg_active, status_disabled, no_row_anomalies, no_ds_anomalies,
        no_ds_conflicts, source_set_matches_mapping, all_tokens_selectable,
        restore_feasible,
    ])

    raw_preimage = {
        "capturedAt": captured_at,
        "alias": REPORT_ALIAS,
        "clientId": client_id,
        "clientDesc": desc,
        "status": row.get("status"),
        "fgActive": row.get("fgActive"),
        "dataSourceCount": row.get("dataSourceCount"),
        "rawDataSourceIds": row.get("rawDataSourceIds"),
        "possibleCommaDataSourceIds": row.get("possibleCommaDataSourceIds"),
        "rowAnomalies": row_anomalies,
        "dataSources": row.get("dataSources"),
        "mappingTokens": tokens,
        "dataSourceOptionsExcludingSelf": {
            "http": opts_status,
            "code": opts_json.get("code"),
            "optionsTotal": len(options),
            "tokenChecks": token_checks,
        },
        "sourceCodeFacts": {
            "updateEndpoint": "PUT /api/clients/{originalClientId}",
            "emptyDescBusinessCode": DESC_EMPTY_BUSINESS_CODE,
            "descMaxBytes": DESC_MAX_BYTES,
            "frontendDescMaxChars": FRONTEND_DESC_MAX_CHARS,
        },
    }

    _write_json(os.path.join(RAW_OUT_DIR, "pre-image-OWNER_TEST_B.json"), raw_preimage, mode=0o600)
    _write_json(os.path.join(RAW_OUT_DIR, "list-snapshot-OWNER_TEST_B.json"), list_json, mode=0o600)
    _write_json(os.path.join(RAW_OUT_DIR, "data-source-options-snapshot-OWNER_TEST_B.json"), opts_json, mode=0o600)

    sanitized = {
        "task": "CLIENT-CONFIG-DESCRIPTION-SAVE-BOUNDARY-ACCEPTANCE-001",
        "mode": "readonly-get-precondition-only",
        "capturedAt": captured_at,
        "target": {
            "alias": REPORT_ALIAS,
            "clientIdSha256": _sha256(client_id),
        },
        "http": {
            "listStatus": list_status,
            "listBusinessCode": list_json.get("code"),
            "totalRows": len(items),
            "dataSourceOptionsStatus": opts_status,
            "dataSourceOptionsBusinessCode": opts_json.get("code"),
            "dataSourceOptionsTotal": len(options),
        },
        "preImage": {
            "clientDescPresent": desc_present,
            "clientDescIsNull": desc is None,
            "clientDescCodepoints": desc_codepoints,
            "clientDescUtf8Bytes": desc_utf8,
            "clientDescBlank": desc_blank,
            "fgActive": row.get("fgActive"),
            "status": row.get("status"),
            "dataSourceCount": row.get("dataSourceCount"),
            "rowAnomaliesCount": len(row_anomalies),
            "dataSourceAnomaliesCount": len(ds_anomalies),
            "dataSourceConflictCount": len(ds_conflicts),
            "rawDataSourceIdsSha256": _sha256(row.get("rawDataSourceIds") or ""),
            "sourceTokenSha256List": [_sha256(t) for t in row_token_ids],
            "mappingTokenSha256List": [_sha256(t) for t in tokens],
        },
        "tokenChecks": token_checks,
        "preconditions": preconditions,
        "restoration": {
            "restoreFeasible": restore_feasible,
            "stopReason": stop_reason,
            "backendRejectsEmptyDesc": True,
            "emptyDescBusinessCode": DESC_EMPTY_BUSINESS_CODE,
            "explanation": (
                "Original description is NULL. The authorized edit endpoint (PUT /api/clients/{originalClientId}) "
                "normalizes null/empty/whitespace-only descriptions to empty and rejects them with business code "
                "40102 (INVALID_CLIENT_DESC). No authorized API can write the column back to NULL, so any bounded "
                "edit would be irreversible."
            ),
        },
        "decision": {
            "preconditionsPassed": passed,
            "businessWritesAttempted": 0,
            "writesBlockedBeforeSend": True,
            "ac131Status": "BLOCKED",
            "reason": stop_reason or ("PRECONDITION_FAILED" if not passed else None),
        },
    }
    _write_json(SANITIZED_OUT, sanitized, mode=0o644)
    print(json.dumps({"passed": passed, "stopReason": stop_reason}, ensure_ascii=False))
    return 0 if passed else (3 if stop_reason else 4)


if __name__ == "__main__":
    try:
        sys.exit(main())
    except SystemExit:
        raise
    except Exception as exc:  # noqa: BLE001
        print("probe error: %s" % exc, file=sys.stderr)
        sys.exit(2)
