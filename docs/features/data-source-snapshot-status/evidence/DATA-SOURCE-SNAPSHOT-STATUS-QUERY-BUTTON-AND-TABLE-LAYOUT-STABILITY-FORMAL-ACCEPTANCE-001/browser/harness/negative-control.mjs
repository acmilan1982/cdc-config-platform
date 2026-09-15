// PAGE-INDEPENDENT NEGATIVE CONTROL for
// DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-FORMAL-ACCEPTANCE-001.
//
// This script never touches the browser, the backend or the database. It reads the OFFICIAL result JSON
// produced by accept.mjs, copies it, injects a +0.001px displacement into real geometry, and runs the very
// SAME shared judge (./judge.mjs) that the official run used. The judge must therefore report failures and
// this subprocess must really exit with a NON-ZERO code — proving the acceptance path is capable of failing
// and does not simply print deltas and always return 0.
//
// Usage: node negative-control.mjs <official-result.json> <out-dir>
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { judge } from './judge.mjs'

export const MARKER = 'NEGATIVE-CONTROL-0.001PX-DO-NOT-USE-AS-ACCEPTANCE-EVIDENCE'
const INJECT = 0.001

const src = process.argv[2]
const outDir = process.argv[3] ?? '.'
if (!src) { console.error('usage: node negative-control.mjs <official-result.json> <out-dir>'); process.exit(4) }

const official = JSON.parse(readFileSync(src, 'utf8'))
const injected = JSON.parse(JSON.stringify(official))

const injections = []
const bump = (obj, key, where) => { if (obj && typeof obj[key] === 'number') { const before = obj[key]; obj[key] = before + INJECT; injections.push({ where, key, before, after: obj[key] }) } }

for (const [vp, m] of Object.entries(injected.matrix || {})) {
  const long = (m.states || []).find((s) => s.name === 'LONG_IDLE')
  const short = (m.states || []).find((s) => s.name === 'SHORT_IDLE')
  if (!long || !short) continue
  // 1. a table header cell x and width
  if (long.headers && long.headers[0]) { bump(long.headers[0], 'x', `${vp}/LONG_IDLE/headers[0]`); bump(long.headers[0], 'width', `${vp}/LONG_IDLE/headers[0]`) }
  // 2. the main content scroll container's clientWidth
  bump(long.scroll, 'clientWidth', `${vp}/LONG_IDLE/scroll`)
  // 3. a button's own rect x
  if (short.rect && short.rect.queryBtn) bump(short.rect.queryBtn, 'x', `${vp}/SHORT_IDLE/queryBtn`)
}

injected.negativeControlTest = true
injected.negative_control_marker = MARKER
injected.negative_control_injection_px = INJECT
injected.negative_control_injections = injections
injected.derived_from = src

writeFileSync(join(outDir, 'negative-control-result.json'), JSON.stringify(injected, null, 2))
writeFileSync(join(outDir, `negative-control-${MARKER}.txt`), `${MARKER}\n`)

const verdict = judge(injected)
writeFileSync(join(outDir, 'negative-control-judgement.json'), JSON.stringify(verdict, null, 2))

console.log(`negative_control_marker=${MARKER}`)
console.log(`negative_control_injection_px=${INJECT}`)
console.log(`negative_control_injection_count=${injections.length}`)
for (const i of injections) console.log(`  injected ${i.where}.${i.key}: ${i.before} -> ${i.after}`)
console.log(`negative_control_judge_failure_count=${verdict.failure_count}`)
console.log(`negative_control_judge_passed=${verdict.passed}`)
console.log('--- un-rounded failing values reported by the SHARED judge ---')
for (const f of verdict.failures) console.log(`  ${f.field} @ ${f.where}: actual=${f.actual} expected=${f.expected}`)

if (verdict.failure_count > 0) {
  console.log(`negative_control_status=CAUGHT_EXIT_NON_ZERO`)
  process.exit(1)
}
console.log('HARNESS DEFECT: the shared judge did NOT catch a 0.001px displacement.')
process.exit(3)
