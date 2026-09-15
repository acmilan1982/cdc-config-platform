/**
 * 判定 CLI。共用 geometry-judge.mjs 的纯判定函数。
 *
 *   正式运行： node judge-run.mjs --raw raw-geometry.json                → 全通过 exit 0，任一失败 exit 1
 *   负向自证： node judge-run.mjs --raw raw-geometry.json --inject-px 0.001
 *              → 向一个原始几何字段注入 +0.001px，必须真实非零退出
 *
 * 只打印判定结论，不打印“看起来像通过”的伪结论；失败项逐条列出。
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { judge } from './geometry-judge.mjs'

const args = new Map()
for (let i = 2; i < process.argv.length; i += 2) args.set(process.argv[i].replace(/^--/, ''), process.argv[i + 1])
const rawPath = args.get('raw')
if (!rawPath) {
  console.error('usage: node judge-run.mjs --raw <raw-geometry.json> [--inject-px 0.001] [--out <judgement.json>]')
  process.exit(2)
}

const injectPx = args.get('inject-px') !== undefined ? Number(args.get('inject-px')) : null
const outPath = args.get('out')

const raw = JSON.parse(readFileSync(rawPath, 'utf8'))
let negativeControl = null

if (injectPx !== null) {
  if (!Number.isFinite(injectPx) || injectPx === 0) {
    console.error(`invalid --inject-px: ${args.get('inject-px')}`)
    process.exit(2)
  }
  const target = raw.longSamples?.[0]
  if (!target) {
    console.error('negative control requires at least one long sample')
    process.exit(2)
  }
  const before = target.contentArea.rect.x
  target.contentArea.rect.x = before + injectPx
  negativeControl = {
    marker: 'NEGATIVE-CONTROL',
    warning: 'DO-NOT-USE-AS-EVIDENCE',
    injectedPx: injectPx,
    field: 'longSamples[0].contentArea.rect.x',
    before,
    after: target.contentArea.rect.x,
  }
}

const result = judge(raw)
const report = { ...result, negativeControl, source: rawPath }

if (outPath) writeFileSync(outPath, JSON.stringify(report, null, 2))

if (negativeControl) {
  console.log(`NEGATIVE-CONTROL DO-NOT-USE-AS-EVIDENCE injected +${injectPx}px into ${negativeControl.field} (${negativeControl.before} -> ${negativeControl.after})`)
}

console.log(`checks=${result.checks.length} passed=${result.checks.length - result.failures.length} failed=${result.failures.length}`)
for (const f of result.failures) console.log(`FAIL ${f.name} :: ${f.detail}`)

if (!negativeControl && result.pass) {
  console.log('per-viewport deltas:')
  for (const r of result.perViewport) {
    console.log(
      `  ${r.viewport} ca_rect=${JSON.stringify(r.content_area_rect_delta)} ca_clientWidth=${r.content_area_client_width_delta} ` +
        `query=${JSON.stringify(r.query_button_self_rect_delta)} reset=${JSON.stringify(r.reset_button_self_rect_delta)} ` +
        `refresh=${JSON.stringify(r.refresh_button_self_rect_delta)} actions=${JSON.stringify(r.query_actions_rect_delta)} ` +
        `headX=${JSON.stringify(r.all_table_header_cell_x_delta)} headW=${JSON.stringify(r.all_table_header_cell_width_delta)}`,
    )
  }
}

// 退出码与正式运行完全一致：判定失败即非零退出。
// 负向自证的“必须非零退出”由调用方核验该子进程的真实退出码，而不是靠本脚本自报。
console.log(`${negativeControl ? 'NEGATIVE_CONTROL_JUDGEMENT' : 'JUDGEMENT'}=${result.pass ? 'PASS' : 'FAIL'}`)
process.exit(result.pass ? 0 : 1)
