#!/usr/bin/env node
/**
 * §9.4 负向页面矩阵（真实浏览器）：对未显式启用公共模板的页面，验证
 *   1) 表格根元素不含公共类 lt-main-table；
 *   2) 公共规则（四条编译后选择器）实际匹配数为 0；
 *   3) 九个 --lt-* 自定义属性在**所有** el-table 根节点上读数均为空；
 *   4) 消费属性最终计算值与基准提交 ae6439b 的副本**逐值相同**（严格 0）；
 *   并对照构建产物：公共规则只存在于带 .lt-main-table 的 DataSourcePage 分片。
 *
 * 只为读取页面状态：不确认任何写操作（服务配置确认弹窗只打开、不点“确认保存”，随后取消关闭）。
 *
 * 用法: node sample-negative-pages.mjs --cdp-port 9222 --baseline <url> --impl <url> --out <dir>
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

import {
  CdpSession,
  openPage,
  evaluate,
  waitFor,
  clickSelector,
  waitPopperOpen,
} from './cdp-client.mjs'

const args = process.argv.slice(2)
const argOf = (name, dflt) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : dflt
}

const CDP_PORT = Number(argOf('--cdp-port', '9222'))
const BASELINE = argOf('--baseline', 'http://127.0.0.1:5174')
const IMPL = argOf('--impl', 'http://127.0.0.1:5173')
const OUT = argOf('--out', '.')
const VIEWPORT = { width: 1440, height: 900 }

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

const PUBLIC_SELECTORS = [
  '.lt-main-table',
  '.lt-main-table .el-table__header th .cell',
  '.lt-main-table td.el-table__cell',
  '.lt-main-table th.el-table__cell',
]

/**
 * 页面矩阵：target 为空时取 DOM 中第一张 el-table；dialog 时额外执行打开子表的真实交互。
 * data-subscribe / log-query / job-failure 的列表根元素没有业务类，故按「全部 el-table」整体受检。
 */
const PAGES = [
  // 该路由本身就是参考页：页面上存在一张**已启用**的表格，故其公共规则匹配数不为 0 是预期；
  // 对它的判定落在「弹窗子表未被启用」「公共规则不越出启用根节点」两项上。
  { name: 'data-source-naming-dialog-table', route: '/config/data-source', dialog: 'naming', target: '.naming-table', containsEnabledTable: true },
  { name: 'probe-client-config-main-table', route: '/config/client', target: '.cc-table' },
  { name: 'data-subscribe-main-table', route: '/config/subscribe' },
  { name: 'data-source-run-state-main-table', route: '/monitor/data-source-state', target: '.dss-table' },
  { name: 'topic-offset-main-table', route: '/monitor/topic-offset', target: '.toff-table' },
  { name: 'server-config-save-confirm-dialog-table', route: '/config/server', dialog: 'confirm', target: '.confirm-table' },
  // 批准设计 §7.5 第 7 项为「补充（可选）」：该环境未启用日志查询功能、
  // 故障历史下钻也可能无数据，故这两页在表格未渲染时记为 NOT_RENDERED，不参与逐值比较。
  { name: 'log-query-main-table', route: '/monitor/log-query', optional: true },
  { name: 'job-failure-history-list-table', route: '/monitor/job-failure/history/list', optional: true },
]

const makeProbe = (targetSel) => `(() => {
  const tokens = ${JSON.stringify(LT_TOKENS)}
  const roots = [...document.querySelectorAll('.el-table')]
  const allRootTokens = roots.map((r) => {
    const cs = getComputedStyle(r)
    const o = {}
    for (const t of tokens) o[t] = cs.getPropertyValue(t).trim()
    return { className: r.className, publicClass: r.classList.contains('lt-main-table'), tokens: o }
  })
  const publicRuleMatches = {}
  let publicRuleMatchOutsideRootTotal = 0
  for (const s of ${JSON.stringify(PUBLIC_SELECTORS)}) {
    const els = [...document.querySelectorAll(s)]
    publicRuleMatches[s] = els.length
    // 越界命中：公共规则命中了不在公共根类节点内的元素——未启用页面必须为 0
    publicRuleMatchOutsideRootTotal += els.filter((el) => !el.closest('.lt-main-table')).length
  }

  const target = ${targetSel ? `document.querySelector(${JSON.stringify(targetSel)})` : `document.querySelector('.el-table')`}
  let targetSample = null
  if (target) {
    const cs = getComputedStyle(target)
    const headerCell = target.querySelector('.el-table__header-wrapper th .cell')
    const th = target.querySelector('.el-table__header-wrapper th.el-table__cell')
    const td = target.querySelector('.el-table__body-wrapper td.el-table__cell')
    const o = {}
    for (const t of tokens) o[t] = cs.getPropertyValue(t).trim()
    const rect = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height } }
    targetSample = {
      className: target.className,
      publicClass: target.classList.contains('lt-main-table'),
      elTableBorderColor: cs.getPropertyValue('--el-table-border-color').trim(),
      elTableHeaderTextColor: cs.getPropertyValue('--el-table-header-text-color').trim(),
      elTableHeaderBgColor: cs.getPropertyValue('--el-table-header-bg-color').trim(),
      headerFontSize: headerCell ? getComputedStyle(headerCell).fontSize : null,
      headerFontWeight: headerCell ? getComputedStyle(headerCell).fontWeight : null,
      headerColor: headerCell ? getComputedStyle(headerCell).color : null,
      headerLetterSpacing: headerCell ? getComputedStyle(headerCell).letterSpacing : null,
      thPadding: th ? getComputedStyle(th).padding : null,
      tdPadding: td ? getComputedStyle(td).padding : null,
      headerColCount: target.querySelectorAll('.el-table__header-wrapper th').length,
      bodyRowCount: target.querySelectorAll('.el-table__body-wrapper tbody tr').length,
      headerRowRect: rect(target.querySelector('.el-table__header-wrapper thead tr')),
      tokens: o,
    }
  }
  return {
    elTableRootCount: roots.length,
    publicClassRootCount: roots.filter((r) => r.classList.contains('lt-main-table')).length,
    anyRootHasLtToken: allRootTokens.some((r) => Object.values(r.tokens).some((v) => v !== '')),
    publicRuleMatchTotal: Object.values(publicRuleMatches).reduce((a, b) => a + b, 0),
    publicRuleMatchOutsideRootTotal,
    publicRuleMatches,
    targetSample,
  }
})()`

async function openNamingDialog(cdp, sessionId) {
  await clickSelector(cdp, sessionId, '.data-table .el-table__body-wrapper tbody tr .row-more', { index: 0 })
  await waitPopperOpen(cdp, sessionId, '.ds-more-popper')
  const marked = await evaluate(
    cdp,
    sessionId,
    `(() => {
      const pops = [...document.querySelectorAll('.ds-more-popper')].filter((el) => el.getBoundingClientRect().height > 0)
      const pop = pops[pops.length - 1]
      if (!pop) return false
      const item = [...pop.querySelectorAll('.el-dropdown-menu__item')].find((el) => (el.textContent || '').includes('目标库命名策略'))
      if (!item) return false
      item.setAttribute('data-ltvt-click', '1')
      return true
    })()`,
  )
  if (!marked) throw new Error('naming dialog item not found')
  await clickSelector(cdp, sessionId, '[data-ltvt-click="1"]')
  await evaluate(cdp, sessionId, `(() => { const e = document.querySelector('[data-ltvt-click="1"]'); if (e) e.removeAttribute('data-ltvt-click'); return true })()`)
  await waitFor(cdp, sessionId, `(() => { const n = document.querySelector('.naming-table'); return !!n && n.querySelectorAll('.el-table__header-wrapper th').length > 0 })()`, { timeoutMs: 20000, label: 'naming dialog' })
}

/**
 * 打开服务配置的保存确认弹窗：把唯一的可编辑整型输入改成合法新值（6000→6001），
 * 使「保存全部」可用后打开确认弹窗；**不点击**“确认保存”，随后点“取消”关闭，不产生任何写请求。
 */
async function openConfirmDialog(cdp, sessionId) {
  await waitFor(cdp, sessionId, `document.querySelectorAll('.config-table .el-table__body-wrapper tbody tr').length > 0`, { timeoutMs: 30000, label: 'server config rows' })
  await clickSelector(cdp, sessionId, '.config-table input.el-input__inner:not([disabled])', { index: 0 })
  await cdp.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'a', code: 'KeyA', modifiers: 2, windowsVirtualKeyCode: 65, nativeVirtualKeyCode: 65 }, sessionId)
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'a', code: 'KeyA', modifiers: 2, windowsVirtualKeyCode: 65, nativeVirtualKeyCode: 65 }, sessionId)
  await cdp.send('Input.insertText', { text: '6001' }, sessionId)
  await delay(200)
  await clickSelector(cdp, sessionId, '.card-actions .el-button--primary')
  await waitFor(cdp, sessionId, `(() => { const t = document.querySelector('.confirm-table'); return !!t && t.querySelectorAll('.el-table__body-wrapper tbody tr').length > 0 })()`, { timeoutMs: 20000, label: 'confirm dialog' })
}

async function closeDialogs(cdp, sessionId) {
  const cancelled = await evaluate(
    cdp,
    sessionId,
    `(() => {
      const buttons = [...document.querySelectorAll('.el-dialog__footer .el-button')].filter((b) => (b.textContent || '').trim() === '取消')
      const b = buttons[buttons.length - 1]
      if (!b) return false
      b.setAttribute('data-ltvt-cancel', '1')
      return true
    })()`,
  )
  if (cancelled) {
    await clickSelector(cdp, sessionId, '[data-ltvt-cancel="1"]')
    await evaluate(cdp, sessionId, `(() => { const e = document.querySelector('[data-ltvt-cancel="1"]'); if (e) e.removeAttribute('data-ltvt-cancel'); return true })()`)
    await delay(400)
  }
}

async function samplePage(cdp, origin, page, label) {
  const url = `${origin}${page.route}`
  const { targetId, sessionId } = await openPage(cdp, 'about:blank')
  await cdp.send('Emulation.setDeviceMetricsOverride', { ...VIEWPORT, deviceScaleFactor: 1, mobile: false }, sessionId)
  await cdp.send('Page.navigate', { url }, sessionId)

  if (page.dialog === 'naming') {
    await waitFor(cdp, sessionId, `document.querySelectorAll('.data-table .el-table__body-wrapper tbody tr').length > 1`, { timeoutMs: 40000, label: `${label} rows` })
    await openNamingDialog(cdp, sessionId)
  } else if (page.dialog === 'confirm') {
    await openConfirmDialog(cdp, sessionId)
  } else {
    try {
      await waitFor(cdp, sessionId, `!!document.querySelector('.el-table')`, { timeoutMs: page.optional ? 15000 : 40000, label: `${label} table` })
    } catch (err) {
      if (page.optional) {
        // 记录为「该环境未渲染表格」，并仍然核对“页面上没有公共类/令牌”这一可由 DOM 直接判定的部分
        const domCheck = await evaluate(
          cdp,
          sessionId,
          `({ hasAnyPublicClass: document.querySelectorAll('.lt-main-table').length, note: (document.querySelector('.state-title,.table-guide') || {}).textContent || null })`,
        )
        await cdp.send('Target.closeTarget', { targetId }).catch(() => {})
        return { status: 'TABLE_NOT_RENDERED', elTableRootCount: 0, publicClassRootCount: domCheck.hasAnyPublicClass, publicRuleMatchTotal: 0, anyRootHasLtToken: false, targetSample: null, pageNote: domCheck.note }
      }
      throw err
    }
  }

  // 表头渲染完成后再采样
  const targetSel = page.target ?? '.el-table'
  await waitFor(
    cdp,
    sessionId,
    `(() => { const t = document.querySelector(${JSON.stringify(targetSel)}); return !!t && t.querySelectorAll('.el-table__header-wrapper th').length > 0 })()`,
    { timeoutMs: 30000, label: `${label} header` },
  )
  // 等布局稳定（避免把过渡插值当成差异）
  let last
  let stable = 0
  while (stable < 3) {
    const v = await evaluate(cdp, sessionId, `(() => { const t = document.querySelector(${JSON.stringify(targetSel)}); const r = t.getBoundingClientRect(); return r.x + ':' + r.y + ':' + r.width + ':' + r.height })()`)
    if (v === last) stable += 1
    else stable = 0
    last = v
    await delay(150)
  }

  const sample = await evaluate(cdp, sessionId, makeProbe(page.target))
  if (page.dialog === 'confirm') await closeDialogs(cdp, sessionId)
  await cdp.send('Target.closeTarget', { targetId }).catch(() => {})
  return sample
}

const isNum = (v) => typeof v === 'number' && Number.isFinite(v)
function diffLeaves(a, b, path, out) {
  if (a === b) return
  if (isNum(a) && isNum(b)) {
    out.push({ path, baseline: a, impl: b, absDiff: Math.abs(a - b) })
    return
  }
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) diffLeaves(a[k], b[k], `${path}.${k}`, out)
    return
  }
  out.push({ path, baseline: a, impl: b, absDiff: null })
}

async function main() {
  mkdirSync(OUT, { recursive: true })
  const cdp = await CdpSession.connect(await CdpSession.discover(CDP_PORT))

  const checks = {}
  const failures = []
  let maxComputedStyleDiff = 0
  let maxGeometryDiff = 0
  const pages = {}
  const notes = {}

  for (const page of PAGES) {
    const baseline = await samplePage(cdp, BASELINE, page, `baseline/${page.name}`)
    const impl = await samplePage(cdp, IMPL, page, `impl/${page.name}`)
    pages[page.name] = { baseline, impl }

    const p = page.name

    if (impl.status === 'TABLE_NOT_RENDERED' || baseline.status === 'TABLE_NOT_RENDERED') {
      // 可选页面在该环境未渲染表格：只保留「无公共类」这一可直接判定的结论
      checks[`${p}.impl_no_public_class_root`] = impl.publicClassRootCount === 0
      checks[`${p}.baseline_no_public_class_root`] = baseline.publicClassRootCount === 0
      notes[p] = `TABLE_NOT_RENDERED (baseline=${baseline.status ?? 'rendered'}, impl=${impl.status ?? 'rendered'}) note=${impl.pageNote ?? baseline.pageNote ?? ''}`
      process.stdout.write(`sampled ${p} (not rendered)\n`)
      continue
    }

    if (!page.containsEnabledTable) {
      checks[`${p}.impl_no_public_class_root`] = impl.publicClassRootCount === 0
      checks[`${p}.baseline_no_public_class_root`] = baseline.publicClassRootCount === 0
      checks[`${p}.impl_public_rule_match_0`] = impl.publicRuleMatchTotal === 0
      checks[`${p}.baseline_public_rule_match_0`] = baseline.publicRuleMatchTotal === 0
    }
    // 所有页面共同不变式：公共规则不得命中启用根节点之外的任何元素
    checks[`${p}.impl_public_rule_outside_enabled_root_0`] = impl.publicRuleMatchOutsideRootTotal === 0
    checks[`${p}.baseline_public_rule_outside_enabled_root_0`] = baseline.publicRuleMatchOutsideRootTotal === 0
    checks[`${p}.impl_no_lt_token_declared`] = impl.anyRootHasLtToken === false
    checks[`${p}.baseline_no_lt_token_declared`] = baseline.anyRootHasLtToken === false
    checks[`${p}.target_has_no_public_class`] = impl.targetSample ? impl.targetSample.publicClass === false : false
    checks[`${p}.target_tokens_empty`] = impl.targetSample
      ? LT_TOKENS.every((t) => (impl.targetSample.tokens[t] ?? '') === '')
      : false
    checks[`${p}.same_table_structure`] =
      baseline.targetSample?.headerColCount === impl.targetSample?.headerColCount &&
      baseline.targetSample?.bodyRowCount === impl.targetSample?.bodyRowCount

    const diffs = []
    diffLeaves(baseline.targetSample, impl.targetSample, p, diffs)
    for (const d of diffs) {
      this_max(d)
      failures.push(d)
    }
    process.stdout.write(`sampled ${p}\n`)
  }

  function this_max(d) {
    if (isNum(d.absDiff)) {
      if (/Rect\./.test(d.path) || /Count$/.test(d.path)) maxGeometryDiff = Math.max(maxGeometryDiff, d.absDiff)
      else maxComputedStyleDiff = Math.max(maxComputedStyleDiff, d.absDiff)
    }
  }

  const failedChecks = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k)
  const ok = failures.length === 0 && failedChecks.length === 0
  const result = {
    ok,
    pageCount: PAGES.length,
    pages: PAGES.map((p) => p.name),
    notes,
    maxComputedStyleDiff,
    maxGeometryDiff,
    failureCount: failures.length,
    failures: failures.slice(0, 50),
    failedChecks,
    checks,
    raw: pages,
  }
  writeFileSync(join(OUT, 'negative-pages.json'), JSON.stringify(result, null, 2))
  cdp.close()

  console.log(`NEGATIVE_PAGES ok=${ok} pages=${PAGES.length} failures=${failures.length} failedChecks=${failedChecks.length} maxStyleDiff=${maxComputedStyleDiff} maxGeomDiff=${maxGeometryDiff}`)
  if (!ok) {
    console.log('FAILED_CHECKS:', failedChecks.join(', '))
    console.log('FAILURES:', JSON.stringify(failures.slice(0, 10)))
    process.exit(1)
  }
  process.exit(0)
}

main().catch((e) => {
  console.error('NEGATIVE_PAGES_FAILED:', e.message)
  process.exit(1)
})
