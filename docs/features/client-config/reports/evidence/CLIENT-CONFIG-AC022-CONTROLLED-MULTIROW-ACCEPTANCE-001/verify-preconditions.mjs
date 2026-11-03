// Read-only precondition check for CLIENT-CONFIG-AC022-CONTROLLED-MULTIROW-ACCEPTANCE-001.
// GET only. No write branch anywhere in this file.
import { readFileSync, writeFileSync } from 'node:fs'

const BASE = 'http://127.0.0.1:8080'
const MAP = '/root/cdc-controlled-toggle-readiness-001/candidate-map.json'
const PRE = '/root/cdc-controlled-toggle-readiness-001/pre-image-T02.json'
const OUT = '/root/cdc-ac022-multirow-001/precondition-T02.json'

const map = JSON.parse(readFileSync(MAP, 'utf8'))
const t02 = (map.mapping || []).filter((x) => x.alias === 'T02')
if (t02.length !== 1) throw new Error('STOP: T02 alias not unique')
const ID = t02[0].clientId

const pre = JSON.parse(readFileSync(PRE, 'utf8'))
if (pre.clientId !== ID) throw new Error('STOP: pre-image/clientId mismatch')

const reqs = []
async function getJson(p) {
  reqs.push('GET ' + p.split('?')[0])
  const r = await fetch(BASE + p, { signal: AbortSignal.timeout(30000) })
  if (r.status !== 200) throw new Error('HTTP ' + r.status + ' ' + p.split('?')[0])
  const j = await r.json()
  if (j.code !== 200) throw new Error('code ' + j.code + ' ' + p.split('?')[0])
  return j.data
}

const list = await getJson('/api/clients?status=ALL')
const items = list.items || []
const hist = { exact_0: 0, exact_1: 0, other: 0 }
for (const it of items) {
  if (it.fgActive === '0') hist.exact_0++
  else if (it.fgActive === '1') hist.exact_1++
  else hist.other++
}
const matches = items.filter((x) => x.clientId === ID)
if (matches.length !== 1) throw new Error('STOP: exact row count=' + matches.length)
const row = matches[0]

// E1 (list payload) per-token facts
const tokens = (row.dataSources || []).map((d) => d.dataSourceId)
const e1 = (row.dataSources || []).map((d, i) => ({
  token: 'S' + String(i + 1).padStart(2, '0'),
  anomalies: (d.anomalies || []).length,
  conflictClientIds: (d.conflictClientIds || []).length,
}))

// E2 (existing GET with self-exclusion)
const options = await getJson('/api/clients/data-source-options?excludeClientId=' + encodeURIComponent(ID))
const byId = new Map(options.map((o) => [o.dataSourceId, o]))
const e2 = tokens.map((t, i) => {
  const opt = byId.get(t)
  return {
    token: 'S' + String(i + 1).padStart(2, '0'),
    present: !!opt,
    selectable: opt ? opt.selectable === true : null,
    occupiedByCount: opt ? (opt.occupiedByClientIds || []).length : null,
    notSelectableReason: opt ? opt.notSelectableReason || null : null,
  }
})

// Business pre-image comparison (same fields compareRows uses)
const business = ['clientDesc', 'rawDataSourceIds', 'possibleCommaDataSourceIds', 'dataSourceCount', 'rowAnomalies', 'dataSources']
const drift = business.filter((f) => JSON.stringify(pre[f] ?? null) !== JSON.stringify(row[f] ?? null))

const preTokens = (pre.mappingTokens || []).slice().sort().join('|')
const curTokens = tokens.slice().sort().join('|')

const result = {
  ok_readonly_only: true,
  requests: reqs,
  list_total: items.length,
  fg_histogram: hist,
  t02: {
    alias: 'T02',
    id_len: ID.length,
    fgActive: String(row.fgActive),
    status: row.status,
    dataSourceCount: row.dataSourceCount,
    rawDataSourceIds_present: !!row.rawDataSourceIds,
    rowAnomalies: (row.rowAnomalies || []).length,
    possibleCommaDataSourceIds: (row.possibleCommaDataSourceIds || []).length,
    tokenCount: tokens.length,
    tokenSetMatchesPreimage: preTokens === curTokens,
  },
  e1_row_sources: e1,
  e2_self_exclusion_used: true,
  e2_tokens: e2,
  business_drift_fields: drift,
  preconditions: {
    exact_zero: row.fgActive === '0',
    identity_exact: row.clientId === ID,
    no_business_drift: drift.length === 0,
    no_row_anomaly: (row.rowAnomalies || []).length === 0,
    no_comma_ambiguity: (row.possibleCommaDataSourceIds || []).length === 0,
    no_e1_source_anomaly: e1.every((x) => x.anomalies === 0),
    no_e1_source_conflict: e1.every((x) => x.conflictClientIds === 0),
    e2_all_present_selectable: e2.every((x) => x.present && x.selectable === true),
  },
}
result.safe_to_proceed = Object.values(result.preconditions).every(Boolean)
writeFileSync(OUT, JSON.stringify(result, null, 2))
console.log(JSON.stringify(result, null, 2))
