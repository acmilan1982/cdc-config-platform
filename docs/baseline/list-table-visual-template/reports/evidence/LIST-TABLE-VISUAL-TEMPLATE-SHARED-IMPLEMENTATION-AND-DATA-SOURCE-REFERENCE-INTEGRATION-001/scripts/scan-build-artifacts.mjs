#!/usr/bin/env node
/**
 * §7.3 / §9.4 构建产物检查。
 *
 * 用「基线 dist ↔ 实现 dist」的**规则集差分**判定本次接入对产物的净影响，
 * 从而把 Element Plus 库自带的大量裸 `.el-table` 规则排除在噪声之外：
 *   - 本次新增的规则必须全部带 `.lt-main-table` 根类（即不新增任何全局规则）；
 *   - 本次移除的规则必须恰好是被公共层逐值等价替代的四组 `.data-table` 局部规则；
 *   - 公共四条规则只存在于一个分片，且该分片内每条 EP 选择器都由根类限定；
 *   - 产物中不存在 :root/html/body/* 上的 `--lt-*` 声明；
 *   - 九个令牌字面量只出现在被启用页面的 CSS 分片中，不出现在任何 JS 或未启用页面分片。
 *
 * 只读两个 dist 目录，不修改任何文件。
 *
 * 用法: node scan-build-artifacts.mjs [--dist <dir>] [--baseline-dist <dir>] [--out <dir>]
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync, statSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'

const args = process.argv.slice(2)
const argOf = (name, dflt) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : dflt
}

const DIST = resolve(argOf('dist', '/agent/cdc-config-platform/frontend/dist'))
const BASELINE =
  argOf('baseline-dist') ?? (existsSync('/tmp/ltvt-baseline/frontend/dist') ? '/tmp/ltvt-baseline/frontend/dist' : null)
const OUT = argOf('out', '.')
if (!BASELINE) throw new Error('缺少基线 dist：请先 `--baseline-dist <dir>` 指定')

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

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const full = join(dir, e)
    if (statSync(full).isDirectory()) walk(full, out)
    else out.push(full)
  }
  return out
}

/** Vue SFC 作用域哈希随源码变化，属构建产物细节而非语义差异：比较前归一。 */
const SCOPE_RE = /\[data-v-[0-9a-f]+\]/g
const normalize = (selector) => selector.replace(SCOPE_RE, '[data-v-SCOPE]')

/** 收集一个 dist 的全部 CSS 规则，返回 {byKey: Map, files}；键为归一化后的「选择器|声明体」。 */
function collectRules(distDir) {
  const files = walk(distDir).filter((f) => f.endsWith('.css'))
  const byKey = new Map()
  for (const f of files) {
    const text = readFileSync(f, 'utf8')
    for (const m of text.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const selector = (m[1] ?? '').trim()
      const body = (m[2] ?? '').trim()
      const key = `${normalize(selector)}|${body}`
      if (!byKey.has(key)) byKey.set(key, { key, selector, normalizedSelector: normalize(selector), body, file: f.slice(distDir.length + 1) })
    }
  }
  return { byKey, files }
}

const impl = collectRules(DIST)
const baseline = collectRules(BASELINE)

const newRules = [...impl.byKey.values()].filter((r) => !baseline.byKey.has(r.key))
const removedRules = [...baseline.byKey.values()].filter((r) => !impl.byKey.has(r.key))

/** 公共四条规则：选择器含根类。 */
const publicRules = [...impl.byKey.values()].filter((r) => r.selector.includes('.lt-main-table'))
const publicRuleFiles = [...new Set(publicRules.map((r) => r.file))]

/** 公共规则所在分片内的 EP 选择器是否全部由根类限定。 */
const unqualifiedInPublicChunk = [...impl.byKey.values()]
  .filter((r) => publicRuleFiles.includes(r.file) && /\.el-table/.test(r.selector) && !/\.lt-main-table/.test(r.selector))
  .map((r) => ({ file: r.file, selector: r.selector, body: r.body.slice(0, 120) }))

/** 本次新增的全局规则（不含根类）——必须为空。 */
const newGlobalRules = newRules.filter((r) => !r.selector.includes('.lt-main-table')).map((r) => ({ selector: r.selector, body: r.body.slice(0, 120), file: r.file }))

/** 本次移除的规则是否恰为被替代的四组局部规则（均以 .data-table 开头）。 */
const removedNotDataTable = removedRules.filter((r) => !r.selector.includes('.data-table')).map((r) => ({ selector: r.selector, file: r.file }))

/** 产物中的 --lt-* 声明（只统计 `--lt-x:` 形态，不含 var() 内联回退）。 */
const tokenDeclarations = []
for (const r of impl.byKey.values()) if (/--lt-[\w-]+\s*:/.test(r.body)) tokenDeclarations.push({ file: r.file, selector: r.selector, body: r.body.slice(0, 120) })
const rootScopeTokenDeclarations = tokenDeclarations.filter((d) => /(^|[\s,>+~])(:root|html|body|\*)([\s,>+~:.]|$)/.test(d.selector))

/** 令牌字面量出现的产物文件。 */
const tokenLiteralFiles = []
for (const f of walk(DIST)) {
  const text = readFileSync(f, 'utf8')
  const hit = LT_TOKENS.filter((t) => text.includes(t))
  if (hit.length) tokenLiteralFiles.push({ file: f.slice(DIST.length + 1), tokens: hit, isCss: f.endsWith('.css') })
}

const checks = {
  public_rules_are_exactly_4: publicRules.length === 4,
  public_rules_in_single_chunk: publicRuleFiles.length === 1,
  public_chunk_is_data_source_page: publicRuleFiles.every((f) => /^assets\/DataSourcePage-.*\.css$/.test(f)),
  public_chunk_has_no_unqualified_ep_rule: unqualifiedInPublicChunk.length === 0,
  no_new_global_rule: newGlobalRules.length === 0,
  removed_rules_are_only_the_replaced_local_ones: removedRules.length === 4 && removedNotDataTable.length === 0,
  no_token_declaration_in_artifact: tokenDeclarations.length === 0,
  no_root_scope_token_declaration: rootScopeTokenDeclarations.length === 0,
  token_literals_only_in_enabled_page_css: tokenLiteralFiles.length === 1 && tokenLiteralFiles[0].isCss && /^assets\/DataSourcePage-/.test(tokenLiteralFiles[0].file),
  no_token_literal_in_any_js: tokenLiteralFiles.every((f) => f.isCss),
}

const failedChecks = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k)
const result = {
  ok: failedChecks.length === 0,
  dist: DIST,
  baselineDist: BASELINE,
  implRuleCount: impl.byKey.size,
  baselineRuleCount: baseline.byKey.size,
  newRuleCount: newRules.length,
  removedRuleCount: removedRules.length,
  publicRuleFiles,
  failedChecks,
  checks,
  detail: {
    newRules: newRules.map((r) => ({ selector: r.selector, file: r.file })),
    removedRules: removedRules.map((r) => ({ selector: r.selector, file: r.file })),
    unqualifiedInPublicChunk,
    newGlobalRules,
    removedNotDataTable,
    tokenDeclarations,
    rootScopeTokenDeclarations,
    tokenLiteralFiles,
  },
}
mkdirSync(OUT, { recursive: true })
writeFileSync(join(OUT, 'build-artifact-scan.json'), JSON.stringify(result, null, 2))

console.log(
  `BUILD_ARTIFACT_SCAN ok=${result.ok} implRules=${impl.byKey.size} baselineRules=${baseline.byKey.size} ` +
    `newRules=${newRules.length} removedRules=${removedRules.length} publicRules=${publicRules.length}@${publicRuleFiles.join(',')} ` +
    `newGlobalRules=${newGlobalRules.length} tokenDeclarations=${tokenDeclarations.length} ` +
    `tokenLiteralFiles=${tokenLiteralFiles.map((t) => t.file).join(',')}`,
)
if (!result.ok) {
  console.log('FAILED_CHECKS:', failedChecks.join(', '))
  console.log('DETAIL:', JSON.stringify({ newGlobalRules, unqualifiedInPublicChunk, removedNotDataTable, tokenDeclarations, tokenLiteralFiles }, null, 2))
  process.exit(1)
}
process.exit(0)
