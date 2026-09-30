/**
 * §13.3 可选单行固定高亮公共预设 · 真实浏览器层叠核对（隔离夹具）。
 * 驱动本机 headless Chrome（CDP），以真实 Element Plus 表格 + 真实 scoped 编译后的
 * `list-table-visual.css` 核对有/无 opt-in、hover、固定态、固定态 hover、取消态、固定列。
 * 不使用坐标命中，hover 一律用 CSS.forcePseudoState 强制，避免离屏/遮挡造成的假失败。
 * Element Plus 行底色带 0.25s 过渡，读取前必须等过渡结束，否则会读到中间色。
 */
import { setTimeout as delay } from 'node:timers/promises'
import {
  CdpSession,
  openPage,
  evaluate,
  waitFor,
} from '/agent/cdc-config-platform/docs/baseline/list-table-visual-template/reports/evidence/LIST-TABLE-VISUAL-TEMPLATE-SHARED-IMPLEMENTATION-AND-DATA-SOURCE-REFERENCE-INTEGRATION-001/scripts/cdp-client.mjs'

const BASE = process.env.FIXTURE_BASE ?? 'http://127.0.0.1:5173/lt-fixture.html'
const PORT = Number(process.env.CDP_PORT ?? 9222)

const HOVER_BG = 'rgb(244, 244, 245)' // #f4f4f5
const FIXED_BG = 'rgb(225, 228, 232)' // #e1e4e8
const ACCENT = 'rgb(24, 24, 27)' // #18181b
const ACCENT_SHADOW = `${ACCENT} 3px 0px 0px 0px inset` // Chrome 的 box-shadow 序列化顺序
const SETTLE = 500 // > .25s 行过渡

const cdp = await CdpSession.connect(await CdpSession.discover(PORT))
const { sessionId: sid } = await openPage(cdp, 'about:blank')
await cdp.send('DOM.enable', {}, sid)
await cdp.send('CSS.enable', {}, sid)

let nav = 0
async function load(query) {
  await cdp.send('Page.navigate', { url: `${BASE}?${query}&cb=${nav++}` }, sid)
  await waitFor(cdp, sid, `document.querySelectorAll('#app tbody tr').length >= 3`, {
    label: `rows for ?${query}`,
  })
  prevForcedSelector = null
  await delay(150)
}

async function styleOf(selector) {
  return evaluate(
    cdp,
    sid,
    `(() => {
      const el = document.querySelector(${JSON.stringify(selector)})
      if (!el) return null
      const cs = getComputedStyle(el)
      return { bg: cs.backgroundColor, shadow: cs.boxShadow, color: cs.color, cls: el.className }
    })()`,
  )
}

// 记录当前被强制 hover 的行，切换前必须显式清除，否则旧节点的 hover 会残留。
// 存选择器而非 nodeId：Vue 重渲染可能使 nodeId 失效，每次都重新解析。
let prevForcedSelector = null
async function forceHover(rowIndex /* 1-based or null */) {
  const { root } = await cdp.send('DOM.getDocument', { depth: -1 }, sid)
  if (prevForcedSelector) {
    try {
      const { nodeId } = await cdp.send(
        'DOM.querySelector',
        { nodeId: root.nodeId, selector: prevForcedSelector },
        sid,
      )
      if (nodeId) await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [] }, sid)
    } catch { /* 行已不在文档中，无需清除 */ }
    prevForcedSelector = null
  }
  if (rowIndex) {
    const selector = `#app tbody tr:nth-child(${rowIndex})`
    const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector }, sid)
    await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: ['hover'] }, sid)
    prevForcedSelector = selector
  }
  await delay(SETTLE)
}

const rowTd = (r, c) => `#app tbody tr:nth-child(${r}) > td:nth-child(${c})`
const out = {}

// S0 基线：无 opt-in，无固定
await load('optin=0&fixed=-1')
out.s0_noOptIn_noHover = {
  r1c1: await styleOf(rowTd(1, 1)),
  classesInDoc: await evaluate(cdp, sid, `document.querySelectorAll('.lt-row-highlight,.lt-row-highlight__row').length`),
  tableCls: await evaluate(cdp, sid, `document.querySelector('#app .el-table').className`),
}
await forceHover(1)
out.s0_noOptIn_hover = { r1c1: await styleOf(rowTd(1, 1)) }
await forceHover(null)

// S1 opt-in，无固定，无 hover
await load('optin=1&fixed=-1')
out.s1_optIn_noFixed_noHover = { r1c1: await styleOf(rowTd(1, 1)) }

// S2 opt-in，hover 第 1 行
await forceHover(1)
out.s2_optIn_hoverRow1 = { r1c1: await styleOf(rowTd(1, 1)) }
await forceHover(null)

// S3 opt-in，固定第 2 行（含固定右列 td4）
await load('optin=1&fixed=1')
out.s3_optIn_fixedRow2 = {
  r2: {
    c1: await styleOf(rowTd(2, 1)),
    c2: await styleOf(rowTd(2, 2)),
    c3: await styleOf(rowTd(2, 3)),
    c4_fixedCol: await styleOf(rowTd(2, 4)),
  },
  r1c1: await styleOf(rowTd(1, 1)),
  accentRow2: {
    firstCell: (await styleOf(rowTd(2, 1)))?.shadow,
    secondCell: (await styleOf(rowTd(2, 2)))?.shadow,
    thirdCell: (await styleOf(rowTd(2, 3)))?.shadow,
  },
  fixedColumnTdClass: await evaluate(cdp, sid, `document.querySelector('#app tbody tr:nth-child(2) > td:nth-child(4)').className`),
  normalRowColor: (await styleOf(rowTd(1, 1)))?.color,
  fixedRowColor: (await styleOf(rowTd(2, 1)))?.color,
  ellipsisNormal: (await styleOf('#app tbody tr:nth-child(1) .lt-row-action__ellipsis'))?.color,
  ellipsisFixed: (await styleOf('#app tbody tr:nth-child(2) .lt-row-action__ellipsis'))?.color,
}

// S4 固定第 2 行 + hover 第 1 行
await forceHover(1)
out.s4_fixedRow2_hoverRow1 = { r1c1: await styleOf(rowTd(1, 1)), r2c1: await styleOf(rowTd(2, 1)) }
await forceHover(null)

// S5 固定第 2 行 + hover 自身
await forceHover(2)
out.s5_fixedRow2_hoverSelf = { r2c1: await styleOf(rowTd(2, 1)), r2c4: await styleOf(rowTd(2, 4)) }
await forceHover(null)

// S7 取消固定：移除行标记类
out.s7_unfix = {
  before: (await styleOf(rowTd(2, 1)))?.bg,
  removed: await evaluate(cdp, sid, `(() => { const tr = document.querySelector('#app tbody tr:nth-child(2)'); tr.classList.remove('lt-row-highlight__row'); return tr.className })()`),
}
await delay(SETTLE)
out.s7_unfix.after = (await styleOf(rowTd(2, 1)))?.bg

// S8 EP 残留 current-row 底色：给第 2 行加 current-row 后应被归零（不留“看似固定”的底）
out.s8_currentRowResidual = {
  added: await evaluate(cdp, sid, `(() => { const tr = document.querySelector('#app tbody tr:nth-child(2)'); tr.classList.add('current-row'); return tr.className })()`),
}
await delay(SETTLE)
out.s8_currentRowResidual.bg = (await styleOf(rowTd(2, 1)))?.bg

// S9 未 opt-in 的整表零泄漏：hover 第 1 行不得出现预设 hover 灰
await load('optin=0&fixed=-1')
await forceHover(1)
out.s9_noOptIn_hover_leakCheck = { r1c1: await styleOf(rowTd(1, 1)) }
await forceHover(null)

console.log(JSON.stringify(out, null, 2))

// ---- 断言 ----
const problems = []
const eq = (label, got, want) => {
  if (got !== want) problems.push(`${label}: got ${got} want ${want}`)
}
const ne = (label, got, notWant) => {
  if (got === notWant) problems.push(`${label}: must differ from ${notWant}`)
}

eq('S0 无 opt-in 且未 hover 时不出现预设底色', out.s0_noOptIn_noHover.r1c1.bg, 'rgba(0, 0, 0, 0)')
eq('S0 未启用页不含任何 opt-in 类', out.s0_noOptIn_noHover.classesInDoc, 0)
ne('S0 无 opt-in 时 hover 不得为预设 hover 灰', out.s0_noOptIn_hover.r1c1.bg, HOVER_BG)

eq('S1 opt-in 未 hover 不显示 hover 灰', out.s1_optIn_noFixed_noHover.r1c1.bg, 'rgba(0, 0, 0, 0)')
eq('S2 opt-in hover 普通行为预设 hover 灰', out.s2_optIn_hoverRow1.r1c1.bg, HOVER_BG)

for (const [k, v] of Object.entries(out.s3_optIn_fixedRow2.r2)) {
  eq(`S3 固定行每个 td 底色（含固定右列 ${k}）`, v.bg, FIXED_BG)
}
eq('S3 固定行左缘强调仅在首格', out.s3_optIn_fixedRow2.accentRow2.firstCell, ACCENT_SHADOW)
eq('S3 固定行次格无左缘强调', out.s3_optIn_fixedRow2.accentRow2.secondCell, 'none')
eq('S3 固定行第三格无左缘强调', out.s3_optIn_fixedRow2.accentRow2.thirdCell, 'none')
if (!/el-table-fixed-column--right/.test(out.s3_optIn_fixedRow2.fixedColumnTdClass)) {
  problems.push(`S3 第 4 列应为 EP 固定右列，实际 class=${out.s3_optIn_fixedRow2.fixedColumnTdClass}`)
}
eq('S3 固定行文字色不被灰化（与普通行一致）', out.s3_optIn_fixedRow2.fixedRowColor, out.s3_optIn_fixedRow2.normalRowColor)
eq('S3 操作列触发器色不被灰化', out.s3_optIn_fixedRow2.ellipsisFixed, out.s3_optIn_fixedRow2.ellipsisNormal)

eq('S4 固定行压过普通行 hover', out.s4_fixedRow2_hoverRow1.r2c1.bg, FIXED_BG)
eq('S4 hover 其他行时该行为 hover 灰', out.s4_fixedRow2_hoverRow1.r1c1.bg, HOVER_BG)
eq('S5 固定行自 hover 仍为固定底（不移到 hover 灰）', out.s5_fixedRow2_hoverSelf.r2c1.bg, FIXED_BG)
eq('S5 固定行自 hover 时固定列 td 也保持固定底', out.s5_fixedRow2_hoverSelf.r2c4.bg, FIXED_BG)

eq('S7 取消固定前为固定底', out.s7_unfix.before, FIXED_BG)
ne('S7 取消固定后不残留固定底', out.s7_unfix.after, FIXED_BG)
eq('S8 current-row 残留底色被归零', out.s8_currentRowResidual.bg, 'rgba(0, 0, 0, 0)')
ne('S9 未 opt-in 全表 hover 不得出现预设 hover 灰', out.s9_noOptIn_hover_leakCheck.r1c1.bg, HOVER_BG)

console.log('\n=== ASSERTIONS ===')
if (problems.length === 0) console.log('ALL PASSED')
else {
  console.log(`FAILED (${problems.length}):`)
  for (const p of problems) console.log(' - ' + p)
}
cdp.close()
process.exit(problems.length === 0 ? 0 : 1)
