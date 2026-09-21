#!/usr/bin/env node
/**
 * §9.3 fallback 与覆盖验证（真实浏览器，批准设计 §7.4 A–F）+ §9.5 运行时反向控制。
 *
 * 全部覆盖/违规都只在**页面运行时**注入（inline style / <style> 标签），
 * 不写入任何源码、不进入构建产物；脚本结束前断言注入物已全部移除。
 *
 * 判定语义（§7.4）：是否启用只由根元素 className 是否含公共类判定，
 * 不得以「--lt-* 非空」判定启用；未覆盖令牌本身为空是设计预期，不判失败。
 *
 * 用法: node sample-fallback-override.mjs --cdp-port 9222 --impl <url> --out <dir>
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
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : dflt
}

const CDP_PORT = Number(argOf('cdp-port', '9222'))
const IMPL = argOf('impl', 'http://127.0.0.1:5173')
const OUT = argOf('out', '.')
const VIEWPORT = { width: 1440, height: 900 }
const PAGE_PATH = '/config/data-source'
const DEFAULT_HEADER_COLOR = 'rgb(113, 113, 122)' // #71717a 的计算值
const DEFAULT_HEADER_COLOR_HEX = '#71717a' // 自定义属性按 token 字面量求值
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

/** 读取启用表 / 未启用表的消费属性与令牌值。 */
const PROBE = `(() => {
  const read = (sel, headerSel) => {
    const root = document.querySelector(sel)
    if (!root) return { error: 'missing-root:' + sel }
    const cs = getComputedStyle(root)
    const headerCell = root.querySelector(headerSel)
    const th = root.querySelector('.el-table__header-wrapper th.el-table__cell')
    const td = root.querySelector('.el-table__body-wrapper td.el-table__cell')
    const tokens = ['--lt-table-width','--lt-border-color','--lt-header-bg-color','--lt-header-text-color','--lt-header-font-size','--lt-header-font-weight','--lt-header-letter-spacing','--lt-header-cell-padding','--lt-body-cell-padding']
    const lt = {}
    for (const t of tokens) lt[t] = cs.getPropertyValue(t).trim()
    const cell = root.querySelector('.el-table__body-wrapper tbody tr td .cell') || root.querySelector('.el-table__body-wrapper tbody tr td')
    return {
      rootClassName: root.className,
      hasPublicClass: root.classList.contains('lt-main-table'),
      consumes: {
        headerColor: headerCell ? getComputedStyle(headerCell).color : null,
        headerFontSize: headerCell ? getComputedStyle(headerCell).fontSize : null,
        headerFontWeight: headerCell ? getComputedStyle(headerCell).fontWeight : null,
        headerLetterSpacing: headerCell ? getComputedStyle(headerCell).letterSpacing : null,
        thPadding: th ? getComputedStyle(th).padding : null,
        tdPadding: td ? getComputedStyle(td).padding : null,
        bodyCellColor: cell ? getComputedStyle(cell).color : null,
        elTableHeaderTextColor: cs.getPropertyValue('--el-table-header-text-color').trim(),
        elTableHeaderBgColor: cs.getPropertyValue('--el-table-header-bg-color').trim(),
        elTableBorderColor: cs.getPropertyValue('--el-table-border-color').trim(),
      },
      ltTokens: lt,
    }
  }
  return {
    enabled: read('.data-table', '.el-table__header-wrapper th .cell'),
    unused: read('.naming-table', '.el-table__header-wrapper th .cell'),
    injectedStyleCount: document.querySelectorAll('style[data-ltvt-injected]').length,
    inlineOverridePresent: !!document.querySelector('.data-table').style.getPropertyValue('--lt-header-text-color'),
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
  if (!marked) throw new Error('naming dialog menu item not found')
  await clickSelector(cdp, sessionId, '[data-ltvt-click="1"]')
  await evaluate(cdp, sessionId, `(() => { const e = document.querySelector('[data-ltvt-click="1"]'); if (e) e.removeAttribute('data-ltvt-click'); return true })()`)
  await waitFor(
    cdp,
    sessionId,
    `(() => { const n = document.querySelector('.naming-table'); return !!n && n.querySelectorAll('.el-table__header-wrapper th').length > 0 })()`,
    { timeoutMs: 20000, label: 'naming dialog open' },
  )
  // 等弹窗过渡结束
  let last
  let stable = 0
  while (stable < 3) {
    const v = await evaluate(cdp, sessionId, `(() => { const r = document.querySelector('.naming-table').getBoundingClientRect(); return r.y + ':' + r.height })()`)
    if (v === last) stable += 1
    else stable = 0
    last = v
    await delay(150)
  }
}

async function main() {
  mkdirSync(OUT, { recursive: true })
  const wsUrl = await CdpSession.discover(CDP_PORT)
  const cdp = await CdpSession.connect(wsUrl)
  const { targetId, sessionId } = await openPage(cdp, 'about:blank')
  await cdp.send('Emulation.setDeviceMetricsOverride', { ...VIEWPORT, deviceScaleFactor: 1, mobile: false }, sessionId)
  await cdp.send('Page.navigate', { url: `${IMPL}${PAGE_PATH}` }, sessionId)
  await waitFor(cdp, sessionId, `document.querySelectorAll('.data-table .el-table__body-wrapper tbody tr').length > 1`, {
    timeoutMs: 40000,
    label: 'rows loaded',
  })
  await delay(500)

  const checks = {}
  const raw = {}

  // ---------- 基线读数：无任何覆盖 ----------
  await openNamingDialog(cdp, sessionId)
  const noOverride = await evaluate(cdp, sessionId, PROBE)
  raw.noOverride = noOverride

  // C：未覆盖令牌的消费属性取内联 fallback 默认值
  checks.C_fallback_header_color = noOverride.enabled.consumes.headerColor === DEFAULT_HEADER_COLOR
  checks.C_fallback_header_font_size = noOverride.enabled.consumes.headerFontSize === '12px'
  checks.C_fallback_header_font_weight = noOverride.enabled.consumes.headerFontWeight === '600'
  checks.C_fallback_header_letter_spacing = noOverride.enabled.consumes.headerLetterSpacing === '0.12px'
  checks.C_fallback_th_padding = noOverride.enabled.consumes.thPadding === '11px 0px'
  checks.C_fallback_td_padding = noOverride.enabled.consumes.tdPadding === '12px 0px'
  // 自定义属性按 token 原样求值：默认值来自内联回退的字面量，故为 #71717a 而非 rgb()
  checks.C_fallback_ep_tokens = noOverride.enabled.consumes.elTableHeaderTextColor === DEFAULT_HEADER_COLOR_HEX
  checks.C_fallback_table_width = await evaluate(
    cdp,
    sessionId,
    `(() => { const r = document.querySelector('.data-table'); return Math.abs(parseFloat(getComputedStyle(r).width) - r.clientWidth) < 0.5 })()`,
  )
  checks.C_enabled_by_class_not_token =
    noOverride.enabled.hasPublicClass === true && LT_TOKENS.every((t) => noOverride.enabled.ltTokens[t] === '')
  checks.C_unused_table_not_enabled = noOverride.unused.hasPublicClass === false
  checks.C_unused_table_tokens_empty = LT_TOKENS.every((t) => noOverride.unused.ltTokens[t] === '')
  raw.namingDefault = noOverride.unused

  // ---------- A / E：显式覆盖令牌，消费属性按覆盖值生效 ----------
  await evaluate(
    cdp,
    sessionId,
    `(() => { document.querySelector('.data-table').style.setProperty('--lt-header-text-color', 'rgb(1, 2, 3)'); return true })()`,
  )
  await delay(120)
  const overridden = await evaluate(cdp, sessionId, PROBE)
  raw.overridden = overridden
  // A：消费属性读到覆盖值
  checks.A_override_consumed_header_color = overridden.enabled.consumes.headerColor === 'rgb(1, 2, 3)'
  checks.A_override_consumed_ep_token = overridden.enabled.consumes.elTableHeaderTextColor === 'rgb(1, 2, 3)'
  // E：被覆盖令牌本身读到 Feature 值
  checks.E_token_reads_override = overridden.enabled.ltTokens['--lt-header-text-color'] === 'rgb(1, 2, 3)'
  // B：同页另一张未覆盖表格不受影响（弹窗表表头颜色保持默认）
  checks.B_unused_table_unaffected = overridden.unused.consumes.headerColor === raw.namingDefault.consumes.headerColor
  checks.B_unused_table_still_no_public_class = overridden.unused.hasPublicClass === false
  checks.B_unused_table_tokens_still_empty = LT_TOKENS.every((t) => overridden.unused.ltTokens[t] === '')

  // ---------- D：移除覆盖后消费属性回到默认值 ----------
  await evaluate(
    cdp,
    sessionId,
    `(() => { document.querySelector('.data-table').style.removeProperty('--lt-header-text-color'); return true })()`,
  )
  await delay(120)
  const restored = await evaluate(cdp, sessionId, PROBE)
  raw.restored = restored
  checks.D_restored_header_color = restored.enabled.consumes.headerColor === DEFAULT_HEADER_COLOR
  checks.D_restored_ep_token = restored.enabled.consumes.elTableHeaderTextColor === DEFAULT_HEADER_COLOR_HEX
  // F：未覆盖令牌本身为空（不得判失败）
  checks.F_token_empty_after_restore = restored.enabled.ltTokens['--lt-header-text-color'] === ''
  checks.F_no_inline_override_left = restored.inlineOverridePresent === false

  // ---------- §9.5 运行时反向控制 ----------
  // RC1：裸 .el-table__cell 全局规则（不带公共根类）——若源码中存在，它会对全站所有表格生效。
  //      这里注入一条**可被观测**的裸规则，证明采样机制确实能观察到这种越界写法；
  //      源码/产物层面的检出由静态契约测试与构建产物检查承担（见反向控制脚本）。
  const paddingBefore = restored.enabled.consumes.tdPadding
  const bodyCellColorBefore = restored.enabled.consumes.bodyCellColor
  await evaluate(
    cdp,
    sessionId,
    `(() => {
      const s = document.createElement('style')
      s.setAttribute('data-ltvt-injected', 'bare-cell')
      s.textContent = 'td.el-table__cell{color:rgb(9, 9, 9)}'
      document.head.appendChild(s)
      return true
    })()`,
  )
  await delay(120)
  const bareInjected = await evaluate(cdp, sessionId, PROBE)
  raw.bareSelectorReverseControl = bareInjected
  checks.RC1_bare_selector_observable =
    bareInjected.enabled.consumes.bodyCellColor === 'rgb(9, 9, 9)' &&
    bareInjected.enabled.consumes.bodyCellColor !== bodyCellColorBefore &&
    bareInjected.injectedStyleCount === 1

  // RC2：:root 上声明 --lt-*——令牌读取值必须变为非空、消费属性必须随之改变
  await evaluate(
    cdp,
    sessionId,
    `(() => {
      const s = document.createElement('style')
      s.setAttribute('data-ltvt-injected', 'root-token')
      s.textContent = ':root{--lt-header-font-size:99px}'
      document.head.appendChild(s)
      return true
    })()`,
  )
  await delay(120)
  const rootTokenInjected = await evaluate(cdp, sessionId, PROBE)
  raw.rootTokenReverseControl = rootTokenInjected
  checks.RC2_root_token_observable =
    rootTokenInjected.enabled.ltTokens['--lt-header-font-size'] === '99px' &&
    rootTokenInjected.enabled.consumes.headerFontSize === '99px' &&
    rootTokenInjected.injectedStyleCount === 2

  // 清理：移除全部注入，并证明无残留
  await evaluate(
    cdp,
    sessionId,
    `(() => { document.querySelectorAll('style[data-ltvt-injected]').forEach((el) => el.remove()); return true })()`,
  )
  await delay(120)
  const cleaned = await evaluate(cdp, sessionId, PROBE)
  raw.afterCleanup = cleaned
  checks.cleanup_no_injected_style = cleaned.injectedStyleCount === 0
  checks.cleanup_values_back_to_default =
    cleaned.enabled.consumes.tdPadding === paddingBefore &&
    cleaned.enabled.consumes.headerColor === DEFAULT_HEADER_COLOR &&
    cleaned.enabled.consumes.headerFontSize === '12px' &&
    LT_TOKENS.every((t) => cleaned.enabled.ltTokens[t] === '')

  const failedChecks = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k)
  const result = { ok: failedChecks.length === 0, failedChecks, checks, raw }
  writeFileSync(join(OUT, 'fallback-override.json'), JSON.stringify(result, null, 2))
  await cdp.send('Target.closeTarget', { targetId }).catch(() => {})
  cdp.close()

  console.log(`FALLBACK_OVERRIDE ok=${failedChecks.length === 0} checks=${Object.keys(checks).length} failed=${failedChecks.length}`)
  if (failedChecks.length) {
    console.log('FAILED_CHECKS:', failedChecks.join(', '))
    process.exit(1)
  }
  process.exit(0)
}

main().catch((e) => {
  console.error('FALLBACK_OVERRIDE_FAILED:', e.message)
  process.exit(1)
})
