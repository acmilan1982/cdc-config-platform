#!/usr/bin/env node
// 只读就绪核查探针：仅调用既有 GET 接口，不提供任何写方法分支。
// 输出：脱敏 JSON 至本目录；别名→真实 clientId 映射写入仓库外临时文件（仅执行用户可读）。
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(__dirname, 'readiness-results.json')
const BASE = process.env.CC_API_BASE || 'http://127.0.0.1:8080'

const mappingOut = process.env.MAPPING_OUT
if (!mappingOut || !path.isAbsolute(mappingOut)) {
  console.error('MAPPING_OUT must be an absolute path outside the repository')
  process.exit(2)
}

const requests = []
async function getJson(urlPath) {
  requests.push({ method: 'GET', path: urlPath.split('?')[0] })
  const res = await fetch(`${BASE}${urlPath}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(30000),
  })
  if (res.status !== 200) throw new Error(`unexpected HTTP ${res.status} for ${urlPath.split('?')[0]}`)
  const body = await res.json()
  if (body.code !== 200) throw new Error(`unexpected business code ${body.code}`)
  return body.data
}

function classifyRow(item) {
  const ids = Array.isArray(item.dataSources) ? item.dataSources : []
  const tokens = ids.map((d) => d.dataSourceId)
  const distinct = new Set(tokens)
  const reasons = []
  if (item.fgActive !== '0') reasons.push('FG_ACTIVE_NOT_EXACT_0')
  if (!item.rawDataSourceIds || distinct.size === 0) reasons.push('NO_DATA_SOURCE_TOKEN')
  if (tokens.length !== distinct.size) reasons.push('DUPLICATE_TOKEN_IN_ROW')
  if ((item.rowAnomalies || []).length > 0) reasons.push('ROW_ANOMALY')
  if ((item.possibleCommaDataSourceIds || []).length > 0) reasons.push('COMMA_AMBIGUITY')
  if (ids.some((d) => (d.anomalies || []).length > 0)) reasons.push('SOURCE_ANOMALY')
  if (ids.some((d) => (d.conflictClientIds || []).length > 0)) reasons.push('SOURCE_CONFLICT')
  return { eligible: reasons.length === 0, reasons, tokens }
}

const list = await getJson('/api/clients?status=ALL')
const items = Array.isArray(list.items) ? list.items : []

const fgHistogram = { exact_0: 0, exact_1: 0, other: 0 }
for (const it of items) {
  if (it.fgActive === '0') fgHistogram.exact_0 += 1
  else if (it.fgActive === '1') fgHistogram.exact_1 += 1
  else fgHistogram.other += 1
}

const reasonCounts = {}
let eligible = []
for (const it of items) {
  const c = classifyRow(it)
  if (c.eligible) eligible.push({ item: it, tokens: c.tokens })
  for (const r of c.reasons) reasonCounts[r] = (reasonCounts[r] || 0) + 1
}

const eligibleBeforeCap = eligible.length
eligible = eligible.slice(0, 3)
const candidates = []
const mapping = []
const requestLogStart = requests.length

for (let i = 0; i < eligible.length; i += 1) {
  const alias = `T0${i + 1}`
  const { item, tokens } = eligible[i]
  const e2Path = `/api/clients/data-source-options?excludeClientId=${encodeURIComponent(item.clientId)}`
  const options = await getJson(e2Path)
  const byId = new Map(options.map((o) => [o.dataSourceId, o]))
  const tokenFacts = tokens.map((t, idx) => {
    const aliasS = `S${String(idx + 1).padStart(2, '0')}`
    const opt = byId.get(t)
    return {
      tokenAlias: aliasS,
      presentInE2: !!opt,
      selectable: opt ? opt.selectable === true : null,
      notSelectableReason: opt ? opt.notSelectableReason || null : null,
      occupiedByCount: opt ? (opt.occupiedByClientIds || []).length : null,
    }
  })
  const e2AllSelectable = tokenFacts.every((t) => t.presentInE2 && t.selectable === true)
  candidates.push({
    alias,
    fgActiveWas: item.fgActive,
    statusWas: item.status,
    dataSourceCount: item.dataSourceCount,
    distinctTokenCount: tokens.length,
    rowAnomalies: (item.rowAnomalies || []).length,
    possibleCommaDataSourceIds: (item.possibleCommaDataSourceIds || []).length,
    perSourceAnomalies: (item.dataSources || []).reduce((n, d) => n + (d.anomalies || []).length, 0),
    perSourceConflicts: (item.dataSources || []).reduce((n, d) => n + (d.conflictClientIds || []).length, 0),
    e2ExcludeUsed: true,
    e2TokenFacts: tokenFacts,
    e2AllTokensSelectable: e2AllSelectable,
  })
  mapping.push({
    alias,
    clientId: item.clientId,
    clientDesc: item.clientDesc,
    tokens,
  })
}

const e2RequestCount = requests.length - requestLogStart

const result = {
  task_code: 'CLIENT-CONFIG-CONTROLLED-TOGGLE-READINESS-CHECK-001',
  branch: 'develop',
  api_base: BASE,
  method_policy: 'GET only; the probe contains no write-method branch',
  endpoints_called: ['GET /api/clients?status=ALL', 'GET /api/clients/data-source-options?excludeClientId=<raw clientId>'],
  requests: requests,
  write_requests: 0,
  list_total_rows: items.length,
  fg_active_histogram: fgHistogram,
  exclusion_reason_counts: reasonCounts,
  eligible_before_cap: eligibleBeforeCap,
  candidates,
  e2_request_count: e2RequestCount,
  candidate_count: candidates.length,
  technical_readiness: candidates.length > 0 ? 'ELIGIBLE_CANDIDATE_FOUND' : 'NO_ELIGIBLE_CANDIDATE',
  note: 'Aliases only; real clientId/desc/org/connection values are not included. E1 conflictClientIds and E2 results are point-in-time snapshots, not concurrency guarantees.',
}

fs.writeFileSync(OUT, JSON.stringify(result, null, 2) + '\n')
fs.writeFileSync(mappingOut, JSON.stringify({ task_code: result.task_code, generated_at: new Date().toISOString(), mapping }, null, 2) + '\n', { mode: 0o600 })
fs.chmodSync(mappingOut, 0o600)

console.log(JSON.stringify({
  list_total_rows: items.length,
  fg_active_histogram: fgHistogram,
  exclusion_reason_counts: reasonCounts,
  candidates: candidates.map((c) => ({
    alias: c.alias,
    dataSourceCount: c.dataSourceCount,
    distinctTokenCount: c.distinctTokenCount,
    e2AllTokensSelectable: c.e2AllTokensSelectable,
    tokenFacts: c.e2TokenFacts.map((t) => ({ tokenAlias: t.tokenAlias, present: t.presentInE2, selectable: t.selectable, reason: t.notSelectableReason, occupiedByCount: t.occupiedByCount })),
  })),
  technical_readiness: result.technical_readiness,
  requests,
  write_requests: 0,
}, null, 2))
