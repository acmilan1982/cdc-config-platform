#!/usr/bin/env node
/**
 * §9.2 严格逐值判定。
 *
 * 判定分层（依据 §9.2「严格 0；如有浏览器归一化表示差异，比较规范化后的等价值并保存原始值」）：
 *
 * 1. 主列表（.data-table，本次唯一被接入的表格）：计算样式与几何**严格 0**，不允许任何容差。
 * 2. 命名策略弹窗表（.naming-table，未启用负向对照）：计算样式严格 0；几何先要求严格 0，
 *    若存在差异，则必须同时满足
 *      (a) 按 1e-3 px 归一化后完全相等，
 *      (b) 原始差异 ≤ 0.01px，
 *      (c) 原始差异 ≤ 同一基准环境两次独立加载测得的**噪声地板**（baselineA vs baselineB）。
 *    三者同时成立才判为「浏览器亚像素抖动」，否则判失败，并把原始值写入 evidence。
 *
 * 反向控制：--inject-px 0.001 把实现侧主列表一个几何值偏移 0.001px，判定必须失败。
 *
 * 用法: node judge-equivalence.mjs --raw <raw.json> --out <judgement.json> [--inject-px 0.001]
 */
import { readFileSync, writeFileSync } from 'node:fs'

const args = process.argv.slice(2)
const argOf = (name, dflt) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : dflt
}

const RAW = argOf('raw')
const OUT = argOf('out')
const INJECT_PX = Number(argOf('inject-px', '0'))

const EXCLUDED_KEYS = new Set(['rootClassName', 'mainTableHasPublicClass', 'url'])
const NORMALIZE_DP = 3
const SUBPIXEL_MAX_RAW = 0.01

const LT_TOKENS = [
  '--lt-table-width',
  '--lt-border-color',
  '--lt-header-bg-color',
  '--lt-header-text-color',
  '--lt-header-font-size',
  '--lt-header-font-weight',
  '--lt-header-letter-spacing',
  '--lt-header-cell-padding',
  '--lt-body-cell-padding',
]

const raw = JSON.parse(readFileSync(RAW, 'utf8'))

if (INJECT_PX) {
  // §9.5 反向控制：只在内存中偏移实现侧主列表的一个几何值，不写回源数据、不改源码
  const first = raw.viewports[Object.keys(raw.viewports)[0]]
  first.impl.main.firstRowRect.h = Number(first.impl.main.firstRowRect.h) + INJECT_PX
}

const isNum = (v) => typeof v === 'number' && Number.isFinite(v)
/** 几何字段：位于 *Rect 对象内的任意叶子，或 *_Count / *Width / *Height 顶层计数。 */
const isGeometricPath = (path) => /\.(rootRect|headerWrapperRect|headerRowRect|firstRowRect|firstCellRect)\./.test(path) || /(Count|Width|Height)$/.test(path)
const round = (v) => Math.round(v * 10 ** NORMALIZE_DP) / 10 ** NORMALIZE_DP

/** 收集两个采样之间所有叶子的差异（排除允许合法不同的键）。 */
function collectDiffs(a, b, prefix, out) {
  if (a === b) return
  if (isNum(a) && isNum(b)) {
    out.push({ path: prefix, baseline: a, impl: b, absDiff: Math.abs(a - b), geometric: isGeometricPath(prefix) })
    return
  }
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
      if (EXCLUDED_KEYS.has(k)) continue
      collectDiffs(a[k], b[k], `${prefix}.${k}`, out)
    }
    return
  }
  out.push({ path: prefix, baseline: a, impl: b, absDiff: null, geometric: isGeometricPath(prefix) })
}

const VIEWPORTS = Object.keys(raw.viewports)
const checks = {}
const noiseFloor = {}
const failures = []
const subpixelNoise = []

let maxStyleDiffMain = 0
let maxGeomDiffMain = 0
let maxStyleDiffNaming = 0
let maxGeomDiffNaming = 0

for (const vp of VIEWPORTS) {
  const e = raw.viewports[vp]
  if (!e.baselineA || !e.baselineB || !e.impl) {
    failures.push({ path: `${vp}.sampling`, reason: 'missing baselineA/baselineB/impl sample' })
    continue
  }

  // ---- 噪声地板：同一基准环境两次独立加载
  const noiseDiffs = []
  collectDiffs(e.baselineA.main, e.baselineB.main, `${vp}.noise.main`, noiseDiffs)
  collectDiffs(e.baselineA.naming, e.baselineB.naming, `${vp}.noise.naming`, noiseDiffs)
  const noiseGeom = Math.max(0, ...noiseDiffs.filter((d) => d.geometric && isNum(d.absDiff)).map((d) => d.absDiff))
  noiseFloor[vp] = noiseGeom

  // ---- 主列表：严格 0
  for (const section of ['main', 'naming']) {
    const diffs = []
    collectDiffs(e.baselineA[section], e.impl[section], `${vp}.${section}`, diffs)
    for (const d of diffs) {
      const isMain = section === 'main'
      if (isMain) {
        if (d.geometric) maxGeomDiffMain = Math.max(maxGeomDiffMain, isNum(d.absDiff) ? d.absDiff : 0)
        else maxStyleDiffMain = Math.max(maxStyleDiffMain, isNum(d.absDiff) ? d.absDiff : 0)
        failures.push({ path: d.path, baseline: d.baseline, impl: d.impl, absDiff: d.absDiff, reason: 'main-table strict-0 violated' })
        continue
      }
      if (d.geometric) maxGeomDiffNaming = Math.max(maxGeomDiffNaming, isNum(d.absDiff) ? d.absDiff : 0)
      else maxStyleDiffNaming = Math.max(maxStyleDiffNaming, isNum(d.absDiff) ? d.absDiff : 0)

      if (!d.geometric || !isNum(d.absDiff)) {
        failures.push({ path: d.path, baseline: d.baseline, impl: d.impl, absDiff: d.absDiff, reason: 'naming-table non-geometric difference' })
        continue
      }
      const normalizedEqual = round(d.baseline) === round(d.impl)
      const withinAbsolute = d.absDiff <= SUBPIXEL_MAX_RAW
      const withinNoise = d.absDiff <= noiseGeom
      if (normalizedEqual && withinAbsolute && withinNoise) {
        subpixelNoise.push({ path: d.path, baseline: d.baseline, impl: d.impl, absDiff: d.absDiff, noiseFloor: noiseGeom })
      } else {
        failures.push({
          path: d.path,
          baseline: d.baseline,
          impl: d.impl,
          absDiff: d.absDiff,
          reason: `naming-table geometry beyond subpixel-noise policy (normalizedEqual=${normalizedEqual}, withinAbsolute=${withinAbsolute}, withinNoise=${withinNoise}, noiseFloor=${noiseGeom})`,
        })
      }
    }
  }

  // ---- 启用状态与结构断言
  checks[`${vp}.baselineA_main_no_public_class`] = e.baselineA.main.mainTableHasPublicClass === false
  checks[`${vp}.impl_main_has_public_class`] = e.impl.main.mainTableHasPublicClass === true
  checks[`${vp}.baselineA_main_business_class_kept`] = String(e.baselineA.main.rootClassName).includes('data-table')
  checks[`${vp}.impl_main_business_class_kept`] = String(e.impl.main.rootClassName).includes('data-table')
  checks[`${vp}.baselineA_naming_no_public_class`] = e.baselineA.naming.namingTableHasPublicClass === false
  checks[`${vp}.impl_naming_no_public_class`] = e.impl.naming.namingTableHasPublicClass === false

  // ---- 公共规则实际匹配数：启用表单一根节点、无越界命中、未启用表为 0
  const pm = e.impl.publicRuleMatches
  const bm = e.baselineA.publicRuleMatches
  checks[`${vp}.impl_public_root_match_count_eq_1`] = pm['.lt-main-table'].count === 1
  checks[`${vp}.impl_public_root_single_el_table`] = pm['.lt-main-table'].distinctElTableRoots === 1
  checks[`${vp}.impl_descendant_rules_no_leak`] = [
    '.lt-main-table .el-table__header th .cell',
    '.lt-main-table td.el-table__cell',
    '.lt-main-table th.el-table__cell',
  ].every((s) => pm[s].count > 0 && pm[s].outsideRoot === 0 && pm[s].distinctElTableRoots === 1)
  checks[`${vp}.baselineA_public_rules_match_0`] = Object.values(bm).every((v) => v.count === 0)

  // ---- §9.3 F：公共层不声明 --lt-*，启用表与未启用表上九令牌读取值均为空
  checks[`${vp}.impl_tokens_empty_on_enabled_table`] = LT_TOKENS.every((t) => (e.impl.main.ltTokens[t] ?? '') === '')
  checks[`${vp}.impl_tokens_empty_on_naming_table`] = LT_TOKENS.every((t) => (e.impl.naming.ltTokens[t] ?? '') === '')
  checks[`${vp}.baselineA_tokens_empty_on_main_table`] =
    LT_TOKENS.every((t) => (e.baselineA.main.ltTokens[t] ?? '') === '')

  // ---- 同浏览器 / 同视口 / 100% 缩放
  const [w, h] = vp.split('x').map(Number)
  checks[`${vp}.viewport_matches`] =
    e.impl.viewport.innerWidth === e.baselineA.viewport.innerWidth &&
    e.impl.viewport.innerHeight === e.baselineA.viewport.innerHeight
  checks[`${vp}.viewport_size_is_requested`] =
    e.impl.viewport.innerWidth === w && e.impl.viewport.innerHeight === h &&
    e.baselineA.viewport.innerWidth === w && e.baselineA.viewport.innerHeight === h
  checks[`${vp}.device_pixel_ratio_1`] =
    e.impl.viewport.devicePixelRatio === 1 && e.baselineA.viewport.devicePixelRatio === 1
  checks[`${vp}.visual_viewport_scale_1`] =
    e.impl.viewport.visualViewportScale === 1 && e.baselineA.viewport.visualViewportScale === 1

  // ---- 长文本省略与 Tooltip 行为保持
  checks[`${vp}.tooltip_cell_count_positive`] = e.impl.main.tooltipCellCount > 0
  checks[`${vp}.tooltip_cell_count_unchanged`] = e.impl.main.tooltipCellCount === e.baselineA.main.tooltipCellCount
  checks[`${vp}.long_text_ellipsis`] = e.impl.main.longTextOverflow === 'ellipsis' && e.baselineA.main.longTextOverflow === 'ellipsis'
  checks[`${vp}.body_row_count_unchanged`] = e.impl.main.bodyRowCount === e.baselineA.main.bodyRowCount
}

const failedChecks = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k)
const ok = failures.length === 0 && failedChecks.length === 0

const result = {
  ok,
  injectPx: INJECT_PX || 0,
  normalizeDecimals: NORMALIZE_DP,
  subpixelMaxRaw: SUBPIXEL_MAX_RAW,
  noiseFloorPx: noiseFloor,
  maxDifference: {
    mainComputedStyle: maxStyleDiffMain,
    mainGeometry: maxGeomDiffMain,
    namingComputedStyle: maxStyleDiffNaming,
    namingGeometry: maxGeomDiffNaming,
  },
  failureCount: failures.length,
  failures: failures.slice(0, 50),
  subpixelNoiseCount: subpixelNoise.length,
  subpixelNoise: subpixelNoise.slice(0, 50),
  failedChecks,
  checks,
}

if (OUT) writeFileSync(OUT, JSON.stringify(result, null, 2))
console.log(
  `EQUIVALENCE ok=${ok} failures=${failures.length} failedChecks=${failedChecks.length} ` +
    `mainStyleMax=${maxStyleDiffMain} mainGeomMax=${maxGeomDiffMain} ` +
    `namingStyleMax=${maxStyleDiffNaming} namingGeomMax=${maxGeomDiffNaming} ` +
    `subpixelNoise=${subpixelNoise.length}${INJECT_PX ? ` injectPx=${INJECT_PX}` : ''}`,
)
if (!ok) {
  console.log('FAILED_CHECKS:', failedChecks.join(', ') || '(none)')
  console.log('FAILURES:', JSON.stringify(failures.slice(0, 10)))
  process.exit(1)
}
process.exit(0)
