// Read-only verification: /config/client opt-in 3-dot entry + row-height coordination
// vs read-only reference /config/data-source. Non-GET /api/** blocked before navigation.
import { chromium } from 'playwright'
import fs from 'fs'

const BASE = 'http://127.0.0.1:5173'
const OUT = '/tmp/rh-evidence'
fs.mkdirSync(OUT, { recursive: true })

const writes = []
const browser = await chromium.launch({ args: ['--no-sandbox'] })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
await ctx.route('**/api/**', async (route) => {
  const m = route.request().method().toUpperCase()
  if (m === 'GET' || m === 'HEAD' || m === 'OPTIONS') return route.continue()
  writes.push({ method: m, url: route.request().url() })
  return route.abort('blockedbyclient')
})
const page = await ctx.newPage()

const round = (n) => (typeof n === 'number' ? +n.toFixed(3) : null)

const measureClient = () =>
  page.evaluate(() => {
    const rows = [...document.querySelectorAll('.cc-table tbody tr')]
    const out = rows.map((tr, i) => {
      const src = tr.querySelector('.cc-src')
      const tds = [...tr.children]
      const opTd = tds[tds.length - 1]
      const cell = opTd ? opTd.querySelector('.cell') : null
      const link = tr.querySelector('.lt-row-action__ellipsis')
      const cs = opTd ? getComputedStyle(opTd) : null
      const cellCs = cell ? getComputedStyle(cell) : null
      const linkCs = link ? getComputedStyle(link) : null
      const linkBox = link ? link.getBoundingClientRect() : null
      const rowBox = tr.getBoundingClientRect()
      const tag = tr.querySelector('.cc-dstag')
      const tagTone = tag ? (tag.className.match(/cc-dstag--(\w+)/) || [])[1] : null
      // 相邻行/相邻单元格是否被命中区遮挡
      const nextRow = rows[i + 1] ? rows[i + 1].getBoundingClientRect() : null
      return {
        idx: i + 1,
        clientId: src ? src.getAttribute('data-client-id') : null,
        rowH: +rowBox.height.toFixed(3),
        rowTop: +rowBox.top.toFixed(3),
        rowBottom: +rowBox.bottom.toFixed(3),
        tdCount: tds.length,
        opTdIsLast: opTd ? opTd === tr.lastElementChild : null,
        opTdHasOptIn: opTd ? opTd.classList.contains('lt-row-action__cell') : null,
        opTdH: opTd ? +opTd.getBoundingClientRect().height.toFixed(3) : null,
        opTdPadTop: cs ? cs.paddingTop : null,
        opTdPadBottom: cs ? cs.paddingBottom : null,
        cellH: cell ? +cell.getBoundingClientRect().height.toFixed(3) : null,
        cellOverflow: cellCs ? cellCs.overflow : null,
        linkHasOptIn: link ? link.classList.contains('lt-row-action__ellipsis') : false,
        linkHasBizHook: link ? link.classList.contains('cc-more-link') : false,
        linkW: linkBox ? +linkBox.width.toFixed(3) : null,
        linkH: linkBox ? +linkBox.height.toFixed(3) : null,
        linkRadius: linkCs ? linkCs.borderRadius : null,
        linkColor: linkCs ? linkCs.color : null,
        linkCursor: linkCs ? linkCs.cursor : null,
        linkDisplay: linkCs ? linkCs.display : null,
        linkBoxInsideRow: linkBox ? linkBox.top >= rowBox.top - 0.5 && linkBox.bottom <= rowBox.bottom + 0.5 : null,
        linkOverlapsNextRow: linkBox && nextRow ? linkBox.bottom > nextRow.top + 0.5 : null,
        tagTone,
        ambiguous: !!tr.querySelector('.cc-rowbad') || !!tr.querySelector('.cc-count-note'),
      }
    })
    const heads = [...document.querySelectorAll('.cc-table thead th')]
    const lastTh = heads[heads.length - 1]
    const lastThCs = lastTh ? getComputedStyle(lastTh) : null
    return {
      rowCount: rows.length,
      rows: out,
      lastTh: lastTh
        ? {
            text: (lastTh.textContent || '').trim(),
            hasOptInClass: lastTh.classList.contains('lt-row-action__cell'),
            paddingTop: lastThCs.paddingTop,
            paddingBottom: lastThCs.paddingBottom,
            height: +lastTh.getBoundingClientRect().height.toFixed(3),
          }
        : null,
    }
  })

const measureDs = () =>
  page.evaluate(() => {
    const table = document.querySelector('.lt-main-table')
    if (!table) return { error: 'no lt-main-table' }
    const rows = [...table.querySelectorAll('tbody tr')]
    const out = rows.map((tr, i) => {
      const tds = [...tr.children]
      const opTd = tds[tds.length - 1]
      const cell = opTd ? opTd.querySelector('.cell') : null
      const more = tr.querySelector('.row-more')
      const cs = opTd ? getComputedStyle(opTd) : null
      const mb = more ? more.getBoundingClientRect() : null
      return {
        idx: i + 1,
        rowH: +tr.getBoundingClientRect().height.toFixed(3),
        opTdH: opTd ? +opTd.getBoundingClientRect().height.toFixed(3) : null,
        opTdPadTop: cs ? cs.paddingTop : null,
        opTdPadBottom: cs ? cs.paddingBottom : null,
        opTdHasOptIn: opTd ? opTd.classList.contains('lt-row-action__cell') : null,
        cellH: cell ? +cell.getBoundingClientRect().height.toFixed(3) : null,
        moreText: more ? more.textContent.trim() : null,
        moreW: mb ? +mb.width.toFixed(3) : null,
        moreH: mb ? +mb.height.toFixed(3) : null,
      }
    })
    return { rowCount: rows.length, rows: out }
  })

const R = {}

await page.goto(BASE + '/config/client', { waitUntil: 'networkidle', timeout: 30000 })
await page.waitForSelector('.cc-table tbody tr', { timeout: 15000 })
await page.waitForTimeout(700)
for (const [w, h] of [[1440, 900], [1920, 1080]]) {
  await page.setViewportSize({ width: w, height: h })
  await page.waitForTimeout(500)
  R[`client_${w}x${h}`] = await measureClient()
}

// --- 焦点：真实 Tab 到达三点入口并读取焦点态 ---
await page.setViewportSize({ width: 1440, height: 900 })
await page.waitForTimeout(300)
await page.evaluate(() => document.body.focus())
const focusSeq = []
for (let i = 0; i < 60; i++) {
  await page.keyboard.press('Tab')
  const info = await page.evaluate(() => {
    const el = document.activeElement
    if (!el) return null
    return {
      tag: el.tagName,
      cls: el.className && el.className.toString(),
      isEllipsis: el.classList.contains('lt-row-action__ellipsis'),
    }
  })
  focusSeq.push(info)
  if (info && info.isEllipsis) break
}
const focused = focusSeq[focusSeq.length - 1]
R.focus = { reached: !!(focused && focused.isEllipsis), steps: focusSeq.length, focused }
if (focused && focused.isEllipsis) {
  R.focus.computed = await page.evaluate(() => {
    const el = document.activeElement
    const cs = getComputedStyle(el)
    const box = el.getBoundingClientRect()
    const cell = el.closest('.cell')
    const cellBox = cell ? cell.getBoundingClientRect() : null
    const td = el.closest('td')
    const tdBox = td ? td.getBoundingClientRect() : null
    return {
      outlineStyle: cs.outlineStyle,
      outlineWidth: cs.outlineWidth,
      outlineColor: cs.outlineColor,
      outlineOffset: cs.outlineOffset,
      w: +box.width.toFixed(3),
      h: +box.height.toFixed(3),
      cellOverflow: cell ? getComputedStyle(cell).overflow : null,
      // outline-offset 为负 → 描边内嵌于命中区，不进入 .cell 的裁剪区
      outlineInsideClip: cs.outlineOffset === '-2px',
      boxWithinCell: cellBox ? box.top >= cellBox.top - 0.5 && box.bottom <= cellBox.bottom + 0.5 : null,
      boxWithinTd: tdBox ? box.top >= tdBox.top - 0.5 && box.bottom <= tdBox.bottom + 0.5 : null,
    }
  })
}

// --- 悬停态（读取 hover 背景）---
R.hover = await (async () => {
  const link = await page.$('.cc-table tbody tr .lt-row-action__ellipsis')
  if (!link) return { ok: false }
  await link.hover()
  await page.waitForTimeout(200)
  return page.evaluate(() => {
    const el = document.activeElement
    const target = document.querySelector('.cc-table tbody tr .lt-row-action__ellipsis')
    return { ok: true, bg: target ? getComputedStyle(target).backgroundColor : null }
  })
})()

// --- 125% 缩放等效（同物理宽度下布局视口收窄）与窄视口 ---
for (const [label, w, h] of [['zoom125', Math.round(1440 / 1.25), Math.round(900 / 1.25)], ['narrow', 1024, 768]]) {
  await page.setViewportSize({ width: w, height: h })
  await page.waitForTimeout(400)
  R[`client_${label}`] = await measureClient()
}

// --- 参考页（只读对照）---
await page.setViewportSize({ width: 1440, height: 900 })
await page.goto(BASE + '/config/data-source', { waitUntil: 'networkidle', timeout: 30000 })
await page.waitForSelector('.lt-main-table tbody tr', { timeout: 15000 }).catch(() => {})
await page.waitForTimeout(700)
for (const [w, h] of [[1440, 900], [1920, 1080]]) {
  await page.setViewportSize({ width: w, height: h })
  await page.waitForTimeout(500)
  R[`datasource_${w}x${h}`] = await measureDs()
}

R.writesBlocked = writes
fs.writeFileSync(OUT + '/after.json', JSON.stringify(R, null, 2))

const heights = (k) => (R[k].rows ? R[k].rows.filter((r) => !r.ambiguous).map((r) => r.rowH) : [])
console.log(JSON.stringify({
  writesBlocked: writes.length,
  client_1440: heights('client_1440x900'),
  client_1920: heights('client_1920x1080'),
  ds_1440: heights('datasource_1440x900'),
  ds_1920: heights('datasource_1920x1080'),
  client_zoom125: heights('client_zoom125'),
  client_narrow: heights('client_narrow'),
  clientSample: (R.client_1440x900.rows || []).find((r) => !r.ambiguous),
  clientLastTh: R.client_1440x900.lastTh,
  dsSample: R.datasource_1440x900 && R.datasource_1440x900.rows ? R.datasource_1440x900.rows[0] : null,
  focus: R.focus,
  hover: R.hover,
}, null, 2))
await browser.close()
