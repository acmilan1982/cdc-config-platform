#!/usr/bin/env node
/**
 * §9.5 源码级反向控制（代表项）。
 *
 * 四项反向控制（§9.5）：裸 `.el-table__cell`；`:root` 上声明 `--lt-*`；
 * 参考页保留与公共层重复的同义规则；至少 0.001px 的几何偏移。
 * 其中：
 *   - 0.001px 几何偏移由 judge-equivalence.mjs --inject-px 0.001 承担（见 browser/judgement-negative-control.json）；
 *   - 裸选择器 / :root 令牌的**运行时注入**形态由 sample-fallback-override.mjs RC1/RC2 承担；
 *   - 本脚本承担**源码级**形态：在任务专属临时副本中植入违规，再跑真实验收断言，必须全部失败。
 *
 * 临时副本位于 /tmp，只 `cp` 工作树中的前端源码与配置，绝不写回仓库、提交或构建产物。
 *
 * 用法: node reverse-controls-source.mjs [--out <dir>]
 */
import { execFileSync } from 'node:child_process'
import { writeFileSync, mkdirSync, rmSync, readFileSync, copyFileSync, symlinkSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'

const args = process.argv.slice(2)
const argOf = (name, dflt) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : dflt
}

const OUT = argOf('out', '.')
const REPO = resolve(argOf('repo', '/agent/cdc-config-platform'))
const FRONTEND = join(REPO, 'frontend')
const VITEST = join(FRONTEND, 'node_modules/.bin/vitest')
const CONTROL_DIR = argOf('control-dir', '/tmp/ltvt-controls')

const CSS_REL = 'src/styles/list-table/list-table-visual.css'
const PAGE_REL = 'src/views/data-source/DataSourcePage.vue'
const STATIC_SPEC = 'src/styles/list-table/list-table-visual.spec.ts'
const PAGE_SPEC = 'src/views/data-source/dataSource.spec.ts'

/** 去掉代理变量：本机 vitest 不需要，且服务器代理会让本地请求走向 502。 */
const cleanEnv = () => {
  const env = { ...process.env }
  for (const k of ['http_proxy', 'https_proxy', 'HTTP_PROXY', 'HTTPS_PROXY', 'npm_config_proxy', 'npm_config_https_proxy']) delete env[k]
  return env
}

const PAGE_ENTRIES = [
  'src',
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'tsconfig.node.json',
  'vite.config.ts',
  'vitest.config.ts',
  'env.d.ts',
  'index.html',
]

function prepareControlCopy() {
  rmSync(CONTROL_DIR, { recursive: true, force: true })
  mkdirSync(CONTROL_DIR, { recursive: true })
  for (const entry of PAGE_ENTRIES) {
    execFileSync('cp', ['-r', join(FRONTEND, entry), join(CONTROL_DIR, entry)], { env: cleanEnv() })
  }
  symlinkSync(join(FRONTEND, 'node_modules'), join(CONTROL_DIR, 'node_modules'))
}

/** 运行一个 spec；返回 {exitCode, failedTests}。 */
function runVitest(specRel, testNameFilter) {
  const argv = ['run', specRel]
  if (testNameFilter) argv.push('-t', testNameFilter)
  let out = ''
  let exitCode = 0
  try {
    out = execFileSync(VITEST, argv, { cwd: CONTROL_DIR, env: cleanEnv(), encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
  } catch (err) {
    exitCode = typeof err.status === 'number' ? err.status : 1
    out = `${err.stdout ?? ''}${err.stderr ?? ''}`
  }
  const failed = [...out.matchAll(/FAIL\s+(\S+)\s+>\s+(.+)/g)].map((m) => m[2].trim())
  const summary = (out.match(/Tests\s+.*/) ?? [''])[0].trim()
  return { exitCode, failedTests: failed, summary, tail: out.slice(-1200) }
}

function restoreCss() {
  copyFileSync(join(FRONTEND, CSS_REL), join(CONTROL_DIR, CSS_REL))
}

function appendCss(snippet) {
  const p = join(CONTROL_DIR, CSS_REL)
  writeFileSync(p, `${readFileSync(p, 'utf8')}\n${snippet}\n`)
}

/** RC-S3：把参考页接入前被逐值等价替代的四组局部同义规则重新塞回内联 scoped 块。 */
function reinstateDuplicateRules() {
  const p = join(CONTROL_DIR, PAGE_REL)
  const marker = '   （DS-REQ-146）；本块只保留数据源管理 Feature 专属样式，不保留同义副本。 */\n'
  const src = readFileSync(p, 'utf8')
  if (src.split(marker).length !== 2) throw new Error('RC-S3 锚点未唯一命中，拒绝生成违规副本')
  const dup = `${marker.replace(' */\n', ' */\n')}
/* RC-S3 违规：参考页保留与公共层重复的同义规则 */
.data-table {
  width: 100%;
  --el-table-border-color: #f4f4f5;
  --el-table-header-text-color: #71717a;
  --el-table-header-bg-color: #ffffff;
}

.data-table :deep(.el-table__header th .cell) {
  font-size: 12px;
  font-weight: 600;
  color: #71717a;
  letter-spacing: 0.01em;
}

.data-table :deep(td.el-table__cell) {
  padding: 12px 0;
}

.data-table :deep(th.el-table__cell) {
  padding: 11px 0;
}
`
  writeFileSync(p, src.replace(marker, dup))
}

function main() {
  mkdirSync(OUT, { recursive: true })
  prepareControlCopy()

  const controls = {}

  // Control 0：未植入违规的副本必须全部通过——证明「副本本身」不会自造假失败。
  controls.S0_copy_is_faithful_static = runVitest(STATIC_SPEC)
  controls.S0_copy_is_faithful_page = runVitest(PAGE_SPEC, '被公共层逐值等价替代')

  // Control S1：裸 Element Plus 选择器（不带根类）。
  restoreCss()
  appendCss('/* RC-S1 */\ntd.el-table__cell {\n  padding: var(--lt-body-cell-padding, 12px 0);\n}')
  controls.S1_bare_ep_selector = runVitest(STATIC_SPEC)
  controls.S1_bare_ep_selector.detected = controls.S1_bare_ep_selector.exitCode !== 0

  // Control S2：在 :root 上声明 --lt-* 默认值。
  restoreCss()
  appendCss('/* RC-S2 */\n:root {\n  --lt-header-font-size: 12px;\n}')
  controls.S2_root_token_declaration = runVitest(STATIC_SPEC)
  controls.S2_root_token_declaration.detected = controls.S2_root_token_declaration.exitCode !== 0

  // Control S3：参考页保留与公共层重复的同义规则。
  restoreCss()
  reinstateDuplicateRules()
  controls.S3_duplicate_synonymous_rules = runVitest(PAGE_SPEC, '被公共层逐值等价替代')
  controls.S3_duplicate_synonymous_rules.detected = controls.S3_duplicate_synonymous_rules.exitCode !== 0

  const expectations = {
    S0_copy_is_faithful_static: 0,
    S0_copy_is_faithful_page: 0,
    S1_bare_ep_selector: 1,
    S2_root_token_declaration: 1,
    S3_duplicate_synonymous_rules: 1,
  }
  const unmet = Object.entries(expectations)
    .filter(([k, want]) => (controls[k].exitCode !== 0 ? 1 : 0) !== want)
    .map(([k]) => k)

  const result = {
    ok: unmet.length === 0,
    controlDir: CONTROL_DIR,
    note: '第 4 项反向控制（≥0.001px 几何偏移）见 browser/judgement-negative-control.json；裸选择器/:root 的运行时注入形态见 browser/fallback-override.json',
    expectationNote: '期望 exitCode：副本保真 S0=0（不得自造假失败），三项违规 S1/S2/S3=1',
    unmet,
    controls,
  }
  writeFileSync(join(OUT, 'reverse-controls-source.json'), JSON.stringify(result, null, 2))

  console.log(
    `REVERSE_CONTROLS_SOURCE ok=${result.ok} ` +
      Object.entries(expectations)
        .map(([k, want]) => `${k}=${controls[k].exitCode}(want ${want})`)
        .join(' '),
  )
  if (!result.ok) {
    console.log('UNMET:', unmet.join(', '))
    process.exit(1)
  }
  process.exit(0)
}

main()
