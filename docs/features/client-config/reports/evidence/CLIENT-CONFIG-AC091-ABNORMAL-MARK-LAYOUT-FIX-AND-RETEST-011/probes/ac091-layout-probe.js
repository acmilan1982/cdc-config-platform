/**
 * CLIENT-CONFIG-AC091-ABNORMAL-MARK-LAYOUT-FIX-AND-RETEST-011
 * 探针：/config/client 探针 ID 单元格布局（ID 正文省略 vs 异常标识完整），
 * 以及 /config/data-source（参考 ID 正文），1440x900 / 1920x1080 配对采集。
 *
 * 采集目标（改前/改后同一探针、同一组样本、同一原始状态）：
 *  - 异常标识 `异常：{原始值}` 是否被省略/裁切（逐字符可见性与 clientWidth/scrollWidth）；
 *  - 标识几何是否越出 ID 单元格或覆盖最右固定“操作”列；操作列命中测试；
 *  - ID 正文在空间不足时是否单行省略，悬停是否返回原始完整 ID（Tooltip 不遮住异常原值）；
 *  - 异常行鼠标/键盘编辑入口；“停用/启用/删除”菜单项；相邻三态回归；
 *  - 与数据源管理“数据源 ID”正文的颜色/字重对照。
 *
 * 网络门禁在首次导航前安装：仅放行同源静态资源 GET 与
 * /api/clients、/api/clients/data-source-options、/api/data-sources 三条只读 GET；
 * 阻断全部业务非 GET 与越界请求，backendNonGetForwarded 必须为 0。
 * Service Worker：serviceWorkers:'block'。只读采集，不提交表单、不写库。
 */
'use strict'

const { chromium } = require('/root/.hermes/hermes-agent/node_modules/playwright-core')
const fs = require('node:fs')
const path = require('node:path')
const http = require('node:http')

const BASE = 'http://127.0.0.1:5173'
const EXE = '/root/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome'
const OUT = process.argv[2] || path.join(__dirname, '..')
const VIEWPORTS = [
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1920x1080', width: 1920, height: 1080 },
]
const READONLY_API_PATHS = new Set([
  '/api/clients',
  '/api/clients/data-source-options',
  '/api/data-sources',
])
const SAMPLE = {
  enabled: 'hosp-012',
  disabled: 'hosp-008',
  abnormalShort: 'CCFG012X',
  abnormal12: 'CCFG010-ABN1',
  abnormalMax: 'CCFG011-ABNORMAL-LENGTH-MAX-6789',
  normalLong: 'CCFG004-LONGID-0123456789ABCDEFG',
  dsEnabled: '77711',
  dsInactive: 's-dssr1-0906-1',
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true })
}
function saveJSON(file, obj) {
  fs.writeFileSync(file, JSON.stringify(obj, null, 2) + '\n', 'utf8')
}
function httpGetJSON(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { timeout: 15000 }, (res) => {
      let body = ''
      res.setEncoding('utf8')
      res.on('data', (c) => (body += c))
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, json: JSON.parse(body) })
        } catch (e) {
          reject(new Error(`invalid JSON from ${url}: ${e.message}`))
        }
      })
    })
    req.on('timeout', () => req.destroy(new Error('timeout')))
    req.on('error', reject)
  })
}

/* ---------------------------------------------------------------- contrast */

function parseColor(s) {
  if (!s) return null
  const m = s.match(/rgba?\(([^)]+)\)/)
  if (!m) return null
  const parts = m[1].split(',').map((x) => parseFloat(x.trim()))
  return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 }
}
function relLum({ r, g, b }) {
  const f = (v) => {
    v /= 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}
function contrastRatio(fg, bg) {
  const a = parseColor(fg)
  const b = parseColor(bg)
  if (!a || !b) return null
  const l1 = relLum(a)
  const l2 = relLum(b)
  const hi = Math.max(l1, l2)
  const lo = Math.min(l1, l2)
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100
}

/* ------------------------------------------------------- in-page helpers */

function pageCollectClient011(args) {
  const round = (n) => Math.round(n * 100) / 100
  const rect = (el) => {
    if (!el) return null
    const r = el.getBoundingClientRect()
    return {
      x: round(r.x), y: round(r.y), left: round(r.left), top: round(r.top),
      right: round(r.right), bottom: round(r.bottom),
      width: round(r.width), height: round(r.height),
    }
  }
  const style = (el, props) => {
    if (!el) return null
    const c = getComputedStyle(el)
    const out = {}
    for (const p of props) out[p] = c.getPropertyValue(p)
    return out
  }
  const effectiveBg = (el) => {
    let e = el
    while (e) {
      const bg = getComputedStyle(e).backgroundColor
      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
        return { value: bg, sourceTag: e.tagName, sourceClass: String(e.className || '') }
      }
      e = e.parentElement
    }
    return { value: 'rgba(0, 0, 0, 0)', sourceTag: null, sourceClass: '' }
  }
  const rowByText = (text) => {
    const rows = Array.from(document.querySelectorAll('.cc-table .el-table__row'))
    return rows.find((r) => {
      const t = r.querySelector('.cc-id')
      return t && t.textContent.trim() === text
    }) || null
  }
  const rectCenter = (r) => (r ? { x: round(r.x + r.width / 2), y: round(r.y + r.height / 2) } : null)
  const rectCenterY = (r) => (r ? r.top + r.height / 2 : null)

  // 逐字符可见性：字符矩形落在元素可裁剪内容框内才算完整可见。
  // 对 overflow:hidden + text-overflow:ellipsis 的元素，被省略的字符矩形会落在裁剪框之外。
  const textMetrics = (el) => {
    if (!el) return null
    const cs = getComputedStyle(el)
    const r = el.getBoundingClientRect()
    const padL = parseFloat(cs.paddingLeft) || 0
    const padR = parseFloat(cs.paddingRight) || 0
    const borderL = parseFloat(cs.borderLeftWidth) || 0
    const clipLeft = r.left + borderL + padL
    const clipRight = r.left + borderL + el.clientWidth - padR
    const node = el.firstChild
    const text = node && node.nodeType === 3 ? node.textContent : el.textContent || ''
    const chars = []
    let visible = ''
    let lastCharRight = null
    if (node && node.nodeType === 3) {
      const range = document.createRange()
      for (let i = 0; i < text.length; i++) {
        range.setStart(node, i)
        range.setEnd(node, i + 1)
        const rects = range.getClientRects()
        const cr = rects && rects[0]
        if (!cr) {
          chars.push({ ch: text[i], visible: false, noRect: true })
          continue
        }
        const fullyVisible = cr.left >= clipLeft - 0.5 && cr.right <= clipRight + 0.5
        if (fullyVisible) visible += text[i]
        chars.push({
          ch: text[i],
          left: round(cr.left),
          right: round(cr.right),
          fullyVisible,
        })
        lastCharRight = round(cr.right)
      }
    }
    return {
      text,
      visibleText: visible,
      clipped: el.scrollWidth > el.clientWidth + 1,
      clientWidth: el.clientWidth,
      scrollWidth: el.scrollWidth,
      clipLeft: round(clipLeft),
      clipRight: round(clipRight),
      lastCharRight,
      chars,
    }
  }

  const bodyProps = [
    'color', 'font-weight', 'font-size', 'font-family', 'background-color',
    'overflow', 'text-overflow', 'white-space', 'line-height', 'letter-spacing',
  ]
  const markProps = [
    'display', 'box-sizing', 'height', 'line-height', 'padding', 'margin',
    'border', 'border-radius', 'background-color', 'color', 'font-size',
    'font-weight', 'font-family', 'flex', 'min-width', 'max-width', 'overflow',
    'text-overflow', 'white-space', 'vertical-align',
  ]
  const cellProps = ['overflow', 'flex', 'min-width', 'width']

  const describeRow = (row) => {
    if (!row) return null
    // 逐行滚动到视口内再测量：96 行全渲染，离屏行 getBoundingClientRect 越界且
    // elementFromPoint 返回 null，会造成操作列命中测试假阴性。
    row.scrollIntoView({ block: 'center', inline: 'nearest' })
    const idText = row.querySelector('.cc-id')
    const idCell = row.querySelector('.cc-id-cell')
    const idTd = row.querySelector('td.cc-col-id')
    const inactive = row.querySelector('.cc-inactive-mark')
    const abnormal = row.querySelector('.cc-abnormal-mark')
    const bg = effectiveBg(idTd)
    const idRect = rect(idText)
    const cellRect = rect(idCell)
    const markEl = abnormal || inactive
    const markRect = rect(markEl)
    const opCells = Array.from(row.querySelectorAll('td.lt-row-action__cell'))
    const opRect = rect(opCells[0])

    const opHit = (() => {
      const c = rectCenter(opRect)
      if (!c) return null
      const hit = document.elementFromPoint(c.x, c.y)
      const td = hit ? hit.closest('td') : null
      return {
        point: c,
        hitTag: hit ? hit.tagName : null,
        hitClass: hit ? String(hit.className || '') : null,
        insideOperationCell: !!td && opCells.includes(td),
        hitAriaLabel: hit ? (hit.closest('[aria-label]') || {}).getAttribute?.('aria-label') || null : null,
      }
    })()

    return {
      idText: idText ? idText.textContent : null,
      idLength: idText ? idText.textContent.length : null,
      idRect,
      idTdRect: rect(idTd),
      idCellRect: cellRect,
      bodyStyle: style(idText, bodyProps),
      cellStyle: style(idCell, cellProps),
      effectiveCellBackground: bg,
      idMetrics: textMetrics(idText),
      noWrap: idText ? (idText.getBoundingClientRect().height <= parseFloat(getComputedStyle(idText).lineHeight) + 1) : null,
      markers: {
        hasInactiveMark: !!inactive,
        hasAbnormalMark: !!abnormal,
        inactiveText: inactive ? inactive.textContent.trim() : null,
        abnormalText: abnormal ? abnormal.textContent.trim() : null,
      },
      mark: markEl
        ? {
            kind: abnormal ? 'abnormal' : 'inactive',
            text: markEl.textContent.trim(),
            rect: markRect,
            style: style(markEl, markProps),
            textMetrics: textMetrics(markEl),
            extendsBeyondCellRight:
              markRect && cellRect ? round(markRect.right - cellRect.right) : null,
            extendsBeyondTdRight:
              markRect && rect(idTd) ? round(markRect.right - rect(idTd).right) : null,
            offsetFromIdRight: idRect ? round(markRect.left - idRect.right) : null,
            centerYDeltaFromId: idRect ? round(rectCenterY(markRect) - rectCenterY(idRect)) : null,
            overlapsOperationColumn:
              markRect && opRect ? !(markRect.right <= opRect.left + 0.5) : null,
          }
        : null,
      operation: {
        cellCount: opCells.length,
        rect: opRect,
        hit: opHit,
        markRightVsOperationLeft:
          markRect && opRect ? round(markRect.right - opRect.left) : null,
      },
    }
  }

  const headers = Array.from(
    document.querySelectorAll('.cc-table .el-table__header th .cell'),
  ).map((c) => c.textContent.replace(/\s+/g, ' ').trim())

  const rows = {
    enabled: describeRow(rowByText(args.enabled)),
    disabled: describeRow(rowByText(args.disabled)),
    abnormalShort: describeRow(rowByText(args.abnormalShort)),
    abnormal12: describeRow(rowByText(args.abnormal12)),
    abnormalMax: describeRow(rowByText(args.abnormalMax)),
    normalLong: describeRow(rowByText(args.normalLong)),
  }

  return {
    headers,
    sampleRowsFound: Object.fromEntries(
      Object.entries(rows).map(([k, v]) => [k, !!v]),
    ),
    idCell: rows.abnormal12 || rows.abnormalShort || rows.enabled,
    abnormalMarkerGlobalCount: document.querySelectorAll('.cc-abnormal-mark').length,
    rows,
    statesAvailable: {
      on: !!rows.enabled,
      off: !!rows.disabled,
      abnormal: !!(rows.abnormalShort || rows.abnormal12 || rows.abnormalMax),
    },
  }
}

function pageCollectDataSource011(args) {
  const round = (n) => Math.round(n * 100) / 100
  const rect = (el) => {
    if (!el) return null
    const r = el.getBoundingClientRect()
    return {
      x: round(r.x), y: round(r.y), left: round(r.left), top: round(r.top),
      right: round(r.right), bottom: round(r.bottom),
      width: round(r.width), height: round(r.height),
    }
  }
  const style = (el, props) => {
    if (!el) return null
    const c = getComputedStyle(el)
    const out = {}
    for (const p of props) out[p] = c.getPropertyValue(p)
    return out
  }
  const effectiveBg = (el) => {
    let e = el
    while (e) {
      const bg = getComputedStyle(e).backgroundColor
      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
        return { value: bg, sourceTag: e.tagName, sourceClass: String(e.className || '') }
      }
      e = e.parentElement
    }
    return { value: 'rgba(0, 0, 0, 0)', sourceTag: null, sourceClass: '' }
  }
  const rowByText = (text) => {
    const rows = Array.from(document.querySelectorAll('.data-table .el-table__row'))
    return rows.find((r) => {
      const t = r.querySelector('.ds-id-text')
      return t && t.textContent.trim() === text
    }) || null
  }
  const bodyProps = [
    'color', 'font-weight', 'font-size', 'font-family', 'background-color',
    'overflow', 'text-overflow', 'white-space', 'line-height', 'letter-spacing',
  ]
  const describe = (row) => {
    if (!row) return null
    const idText = row.querySelector('.ds-id-text')
    const idCell = row.querySelector('.ds-id-cell')
    return {
      idText: idText ? idText.textContent : null,
      idRect: rect(idText),
      bodyStyle: style(idText, bodyProps),
      cellStyle: style(idCell, ['background-color', 'padding', 'font-size', 'font-weight', 'color']),
      effectiveCellBackground: effectiveBg(idCell),
    }
  }
  return {
    enabled: describe(rowByText(args.dsEnabled)),
    inactive: describe(rowByText(args.dsInactive)),
  }
}

function collectEnv() {
  const round = (n) => Math.round(n * 100) / 100
  const sidebar = document.querySelector('.sidebar')
  const sr = sidebar ? sidebar.getBoundingClientRect() : null
  return {
    href: location.href,
    title: document.title,
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    outerWidth: window.outerWidth,
    outerHeight: window.outerHeight,
    devicePixelRatio: window.devicePixelRatio,
    visualViewportScale: window.visualViewport ? window.visualViewport.scale : null,
    fontsStatus: document.fonts ? document.fonts.status : null,
    bodyFontSize: getComputedStyle(document.body).fontSize,
    serviceWorkerControlled: !!(navigator.serviceWorker && navigator.serviceWorker.controller),
    sidebar: sidebar
      ? {
          collapsedClass: sidebar.classList.contains('collapsed'),
          width: round(sr.width),
          rect: { x: round(sr.x), y: round(sr.y), width: round(sr.width), height: round(sr.height) },
        }
      : null,
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    collectedAt: new Date().toISOString(),
  }
}

/* ----------------------------------------------------------------- main */

async function settle(page, rowSelector) {
  await page.waitForFunction((sel) => document.querySelectorAll(sel).length > 0, rowSelector, { timeout: 30000 })
  await page.evaluate(async () => {
    if (document.fonts && document.fonts.ready) await document.fonts.ready
  })
  await page.waitForTimeout(300)
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
}

async function readTip(page) {
  return page.evaluate(() => {
    const el = document.querySelector('.cc-single-tip')
    if (!el) return { exists: false }
    const c = getComputedStyle(el)
    const r = el.getBoundingClientRect()
    return {
      exists: true,
      visible: c.display !== 'none' && c.visibility !== 'hidden' && r.width > 0,
      text: el.textContent.trim(),
      rect: {
        x: Math.round(r.x * 100) / 100,
        y: Math.round(r.y * 100) / 100,
        left: Math.round(r.left * 100) / 100,
        top: Math.round(r.top * 100) / 100,
        right: Math.round(r.right * 100) / 100,
        bottom: Math.round(r.bottom * 100) / 100,
        width: Math.round(r.width * 100) / 100,
        height: Math.round(r.height * 100) / 100,
      },
      role: el.getAttribute('role'),
    }
  })
}

async function hoverTip(page, locator) {
  await locator.scrollIntoViewIfNeeded()
  const box = await locator.boundingBox()
  if (!box) return { tipVisible: null, error: 'no-box' }
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.waitForTimeout(600)
  const tip = await readTip(page)
  await page.mouse.move(2, 2)
  await page.waitForTimeout(150)
  return tip
}

function intersect(a, b) {
  if (!a || !b) return null
  const w = Math.min(a.right, b.right) - Math.max(a.left, b.left)
  const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)
  return w > 0 && h > 0
}

async function openDialogAndCancel(page, via) {
  const dialog = page.locator('.el-dialog').filter({ hasText: '编辑探针' }).first()
  await dialog.waitFor({ state: 'visible', timeout: 10000 })
  await page.waitForTimeout(300)
  const info = await page.evaluate(() => {
    const d = Array.from(document.querySelectorAll('.el-dialog')).find((x) =>
      x.textContent.includes('编辑探针'),
    )
    const title = d ? d.querySelector('.el-dialog__title') : null
    const r = d ? d.getBoundingClientRect() : null
    const active = document.activeElement
    return {
      visible: !!d,
      title: title ? title.textContent.trim() : null,
      rect: r ? { x: r.x, y: r.y, width: r.width, height: r.height } : null,
      postFormPresent: !!document.querySelector('.el-dialog form'),
      activeElementTag: active ? active.tagName : null,
      activeElementClass: active ? String(active.className || '') : null,
    }
  })
  const cancel = page
    .locator('.el-dialog')
    .filter({ hasText: '编辑探针' })
    .locator('button')
    .filter({ hasText: '取消' })
    .first()
  await cancel.click()
  await dialog.waitFor({ state: 'hidden', timeout: 10000 })
  await page.waitForTimeout(200)
  return { via, ...info, closedWithoutSave: true }
}

async function rowLocator(page, id) {
  return page
    .locator('.cc-table .el-table__row')
    .filter({ has: page.locator('.cc-id', { hasText: id }) })
    .first()
}

async function measureRowInteraction(page, viewportName, sampleKey, id, out) {
  const row = await rowLocator(page, id)
  const idLoc = row.locator('.cc-id').first()
  const markLoc = row.locator('.cc-abnormal-mark').first()

  // 1) 悬停 ID：应返回原始完整 ID；同时确认 Tooltip 不遮住异常原值。
  await idLoc.scrollIntoViewIfNeeded()
  const idBox = await idLoc.boundingBox()
  await page.mouse.move(idBox.x + idBox.width / 2, idBox.y + idBox.height / 2)
  await page.waitForTimeout(600)
  const idTip = await readTip(page)
  const markBox = await markLoc.boundingBox()
  const markRect = markBox
    ? {
        left: markBox.x, top: markBox.y, right: markBox.x + markBox.width, bottom: markBox.y + markBox.height,
      }
    : null
  const idTipCoversMark = idTip.exists && idTip.visible && markRect ? intersect(idTip.rect, markRect) : null
  await page.mouse.move(2, 2)
  await page.waitForTimeout(200)

  // 2) 悬停异常标识：完整文案经 Tooltip 可见。
  const markTip = await hoverTip(page, markLoc)

  // 3) 键盘聚焦 ID（不打开弹窗）。
  await idLoc.focus()
  const focus = await page.evaluate((selId) => {
    const rows = Array.from(document.querySelectorAll('.cc-table .el-table__row'))
    const row = rows.find((r) => {
      const t = r.querySelector('.cc-id')
      return t && t.textContent.trim() === selId
    })
    if (!row) return { found: false }
    const el = row.querySelector('.cc-id')
    const cs = getComputedStyle(el)
    return {
      found: true,
      tabIndex: el.tabIndex,
      role: el.getAttribute('role'),
      ariaLabel: el.getAttribute('aria-label'),
      activeElementIsId: document.activeElement === el,
      outlineStyle: cs.outlineStyle,
      outlineWidth: cs.outlineWidth,
      outlineColor: cs.outlineColor,
    }
  }, id)
  await page.mouse.move(2, 2)

  // 4) 鼠标入口：双击 ID 打开“编辑探针”，取消关闭、不保存。
  await idLoc.dblclick()
  const mouseEntry = await openDialogAndCancel(page, `${sampleKey}-id-dblclick`)
  await page.mouse.move(2, 2)

  // 5) 键盘入口：聚焦 ID + Enter。
  await idLoc.focus()
  await page.keyboard.press('Enter')
  const keyboardEntry = await openDialogAndCancel(page, `${sampleKey}-id-focus-enter`)
  await page.mouse.move(2, 2)

  out[sampleKey] = {
    idTip,
    idTipCoversMark,
    markTip,
    focus,
    mouseEntry,
    keyboardEntry,
  }
}

async function readAbnormalMenu(page, id) {
  const row = await rowLocator(page, id)
  const link = row.locator('.cc-more-link').first()
  await link.scrollIntoViewIfNeeded()
  await link.click()
  await page.waitForTimeout(400)
  const items = await page.evaluate(() => {
    // 表格为每行预先创建了 96 个 popper（多数 display:none），必须取当前可见的那个。
    const poppers = Array.from(document.querySelectorAll('.cc-more-popper'))
    const popper = poppers.find((el) => {
      const c = getComputedStyle(el)
      const r = el.getBoundingClientRect()
      return c.display !== 'none' && c.visibility !== 'hidden' && r.width > 0 && r.height > 0
    })
    if (!popper) return null
    return Array.from(popper.querySelectorAll('.el-dropdown-menu__item')).map((el) => ({
      text: el.textContent.trim(),
      disabled: el.classList.contains('is-disabled'),
      divided: el.classList.contains('el-dropdown-menu__item--divided'),
    }))
  })
  await page.keyboard.press('Escape')
  await page.waitForTimeout(250)
  await page.mouse.move(2, 2)
  return items
}

function withContrast(entry) {
  if (!entry) return entry
  const fg = entry.bodyStyle ? entry.bodyStyle.color : null
  const bg = entry.effectiveCellBackground ? entry.effectiveCellBackground.value : null
  entry.contrast = contrastRatio(fg, bg)
  if (entry.mark && entry.mark.style) {
    entry.mark.contrast = contrastRatio(entry.mark.style['color'], entry.mark.style['background-color'])
  }
  return entry
}

async function runViewport(browser, vp) {
  const ledger = []
  const errors = []
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    screen: { width: vp.width, height: vp.height },
    deviceScaleFactor: 1,
    serviceWorkers: 'block',
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
  })
  const backendNonGetForwarded = { value: 0 }
  const blockedBusinessNonGet = { value: 0 }
  await context.route('**/*', async (route) => {
    const req = route.request()
    const url = new URL(req.url())
    const method = req.method()
    let allowed = false
    let reason = ''
    if (url.origin === BASE) {
      if (!url.pathname.startsWith('/api/')) {
        allowed = method === 'GET' || method === 'HEAD' || method === 'OPTIONS'
        reason = allowed ? 'static' : 'blocked-static-non-get'
      } else if (READONLY_API_PATHS.has(url.pathname)) {
        allowed = method === 'GET' || method === 'HEAD' || method === 'OPTIONS'
        reason = allowed ? 'readonly-api-get' : 'blocked-business-non-get'
      } else {
        allowed = false
        reason = 'blocked-out-of-scope-api'
      }
    } else {
      allowed = false
      reason = 'blocked-external'
    }
    if (reason === 'blocked-business-non-get') blockedBusinessNonGet.value += 1
    ledger.push({
      method,
      url: req.url(),
      resourceType: req.resourceType(),
      allowed,
      reason,
    })
    if (allowed) {
      await route.continue()
    } else {
      await route.abort('blockedbyclient')
    }
  })

  const page = await context.newPage()
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push({ type: 'console', text: msg.text() })
  })
  page.on('pageerror', (err) => errors.push({ type: 'pageerror', text: String(err && err.message) }))

  const out = { viewport: vp, browserVersion: browser.version(), ledger }

  // ---------- client page
  await page.goto(`${BASE}/config/client`, { waitUntil: 'domcontentloaded', timeout: 45000 })
  await settle(page, '.cc-table .el-table__row')
  await page.mouse.move(2, 2)
  await page.waitForTimeout(250)

  out.client = { env: await page.evaluate(collectEnv) }
  const measured = await page.evaluate(pageCollectClient011, SAMPLE)
  for (const k of ['enabled', 'disabled', 'abnormalShort', 'abnormal12', 'abnormalMax', 'normalLong']) {
    withContrast(measured.rows[k])
  }
  out.client.measurements = measured

  // 截图（测量之后、交互之前）：各样本 ID 单元格
  const shotRows = [
    ['enabled', SAMPLE.enabled],
    ['disabled', SAMPLE.disabled],
    ['abnormal-short', SAMPLE.abnormalShort],
    ['abnormal-12', SAMPLE.abnormal12],
    ['abnormal-max', SAMPLE.abnormalMax],
    ['normal-long', SAMPLE.normalLong],
  ]
  for (const [tag, id] of shotRows) {
    const row = await rowLocator(page, id)
    await row.locator('td.cc-col-id').screenshot({
      path: path.join(OUT, 'screenshots', `client-011-${tag}-${vp.name}.png`),
    })
  }

  // 异常行编辑/提示交互（原反例 12 字符、长度上限）
  out.client.interactions = {}
  await measureRowInteraction(page, vp.name, 'abnormal12', SAMPLE.abnormal12, out.client.interactions)
  await measureRowInteraction(page, vp.name, 'abnormalMax', SAMPLE.abnormalMax, out.client.interactions)

  // 正常长 ID：Tooltip 与编辑入口回归
  const longRow = await rowLocator(page, SAMPLE.normalLong)
  out.client.normalLongTooltip = await hoverTip(page, longRow.locator('.cc-id').first())
  await longRow.locator('.cc-id').first().dblclick()
  out.client.normalLongEditEntry = await openDialogAndCancel(page, 'normal-long-id-dblclick')
  await page.mouse.move(2, 2)

  // 异常行菜单：仅“停用”“删除”，无“启用”
  out.client.abnormalMenu = await readAbnormalMenu(page, SAMPLE.abnormal12)
  out.client.abnormalMaxMenu = await readAbnormalMenu(page, SAMPLE.abnormalMax)

  // ---------- data-source reference page（只读对照 ID 正文）
  await page.goto(`${BASE}/config/data-source`, { waitUntil: 'domcontentloaded', timeout: 45000 })
  await settle(page, '.data-table .el-table__row')
  await page.mouse.move(2, 2)
  await page.waitForTimeout(250)

  out.dataSource = { env: await page.evaluate(collectEnv) }
  const dsMeasured = await page.evaluate(pageCollectDataSource011, SAMPLE)
  withContrast(dsMeasured.enabled)
  withContrast(dsMeasured.inactive)
  out.dataSource.measurements = dsMeasured

  const dsEnabledLoc = page
    .locator('.data-table .el-table__row')
    .filter({ has: page.locator('.ds-id-text', { hasText: SAMPLE.dsEnabled }) })
    .first()
  const dsInactiveLoc = page
    .locator('.data-table .el-table__row')
    .filter({ has: page.locator('.ds-id-text', { hasText: SAMPLE.dsInactive }) })
    .first()
  await dsEnabledLoc.locator('.ds-id-cell').screenshot({
    path: path.join(OUT, 'screenshots', `ds-011-enabled-id-${vp.name}.png`),
  })
  await dsInactiveLoc.locator('.ds-id-cell').screenshot({
    path: path.join(OUT, 'screenshots', `ds-011-inactive-id-${vp.name}.png`),
  })

  out.backendNonGetForwarded = backendNonGetForwarded.value
  out.blockedBusinessNonGet = blockedBusinessNonGet.value
  out.errors = errors
  out.finishedAt = new Date().toISOString()
  await context.close()
  return out
}

;(async () => {
  ensureDir(OUT)
  ensureDir(path.join(OUT, 'raw'))
  ensureDir(path.join(OUT, 'network'))
  ensureDir(path.join(OUT, 'screenshots'))
  ensureDir(path.join(OUT, 'samples'))

  // 脱敏样本依据：直接只读 GET（非浏览器），仅保留判定所需字段
  const sampleBasis = { collectedAt: new Date().toISOString(), endpoints: {} }
  try {
    const clients = await httpGetJSON('http://127.0.0.1:8080/api/clients?status=ALL')
    const items = clients.json.data.items
    const pick = (id) => {
      const r = items.find((x) => x.clientId === id)
      if (!r) return null
      return {
        clientId: r.clientId,
        idLength: r.clientId.length,
        status: r.status,
        fgActive: r.fgActive,
        fgActiveRawPreserved: r.fgActive !== null && r.fgActive !== undefined,
        clientDescPresent: r.clientDesc !== null && r.clientDesc !== undefined && r.clientDesc !== '',
        dataSourceCount: r.dataSourceCount,
        rowAnomalies: r.rowAnomalies,
      }
    }
    const counts = {}
    for (const x of items) counts[String(x.fgActive)] = (counts[String(x.fgActive)] || 0) + 1
    sampleBasis.endpoints.clients = {
      status: clients.status,
      total: items.length,
      fgActiveDistribution: counts,
      fgActiveValues: Object.keys(counts),
      samples: {
        enabled: pick(SAMPLE.enabled),
        disabled: pick(SAMPLE.disabled),
        abnormalShort: pick(SAMPLE.abnormalShort),
        abnormal12: pick(SAMPLE.abnormal12),
        abnormalMax: pick(SAMPLE.abnormalMax),
        normalLong: pick(SAMPLE.normalLong),
      },
    }
    const ds = await httpGetJSON('http://127.0.0.1:8080/api/data-sources?status=ALL')
    const rows = ds.json.data
    const pickDs = (id) => {
      const r = rows.find((x) => x.dataSourceId === id)
      if (!r) return null
      return {
        dataSourceId: r.dataSourceId,
        dataSourceCategory: r.dataSourceCategory,
        dataSourceType: r.dataSourceType,
        fgActive: r.fgActive,
      }
    }
    sampleBasis.endpoints.dataSources = {
      status: ds.status,
      total: rows.length,
      fgActiveValues: Array.from(new Set(rows.map((x) => String(x.fgActive)))),
      samples: {
        enabled: pickDs(SAMPLE.dsEnabled),
        inactive: pickDs(SAMPLE.dsInactive),
      },
    }
  } catch (e) {
    sampleBasis.error = String(e && e.message)
  }
  saveJSON(path.join(OUT, 'samples', 'sample-basis.json'), sampleBasis)

  const browser = await chromium.launch({
    executablePath: EXE,
    headless: true,
    args: ['--no-sandbox', '--force-device-scale-factor=1', '--disable-lcd-text'],
  })
  const runMeta = {
    task: 'CLIENT-CONFIG-AC091-ABNORMAL-MARK-LAYOUT-FIX-AND-RETEST-011',
    startedAt: new Date().toISOString(),
    baseUrl: BASE,
    browserVersion: browser.version(),
    executable: EXE,
    serviceWorkers: 'block',
    allowlistedReadOnlyApis: Array.from(READONLY_API_PATHS),
    viewports: VIEWPORTS,
    samples: SAMPLE,
    fixture: {
      source: 'authorized synthetic rows on CDC_CLIENT_MULTIPLE, fgActive=X',
      rows: [
        { clientId: 'CCFG012X', idLength: 8, fgActive: 'X' },
        { clientId: 'CCFG010-ABN1', idLength: 12, fgActive: 'X' },
        { clientId: 'CCFG011-ABNORMAL-LENGTH-MAX-6789', idLength: 32, fgActive: 'X' },
      ],
    },
  }
  saveJSON(path.join(OUT, 'network', 'run-meta.json'), runMeta)

  for (const vp of VIEWPORTS) {
    const result = await runViewport(browser, vp)
    saveJSON(path.join(OUT, 'raw', `client-011-${vp.name}.json`), result)
    saveJSON(path.join(OUT, 'network', `ledger-${vp.name}.json`), {
      viewport: vp,
      browserVersion: result.browserVersion,
      entries: result.ledger,
      backendNonGetForwarded: result.backendNonGetForwarded,
      blockedBusinessNonGet: result.blockedBusinessNonGet,
      blockedCount: result.ledger.filter((e) => !e.allowed).length,
      allowedCount: result.ledger.filter((e) => e.allowed).length,
    })
    const m = result.client.measurements.rows
    console.log(
      `${vp.name}: entries=${result.ledger.length} blocked=${result.ledger.filter((e) => !e.allowed).length} nonGetForwarded=${result.backendNonGetForwarded} errors=${result.errors.length}\n` +
        `  abnormal12 mark: text=${JSON.stringify(m.abnormal12 && m.abnormal12.mark && m.abnormal12.mark.text)} visible=${JSON.stringify(m.abnormal12 && m.abnormal12.mark && m.abnormal12.mark.textMetrics.visibleText)} clipped=${m.abnormal12 && m.abnormal12.mark && m.abnormal12.mark.textMetrics.clipped} overlapOp=${m.abnormal12 && m.abnormal12.mark && m.abnormal12.mark.overlapsOperationColumn}\n` +
        `  abnormalMax mark: visible=${JSON.stringify(m.abnormalMax && m.abnormalMax.mark && m.abnormalMax.mark.textMetrics.visibleText)} clipped=${m.abnormalMax && m.abnormalMax.mark && m.abnormalMax.mark.textMetrics.clipped}\n` +
        `  abnormal12 id: visible=${JSON.stringify(m.abnormal12 && m.abnormal12.idMetrics.visibleText)} clipped=${m.abnormal12 && m.abnormal12.idMetrics.clipped}`,
    )
  }

  await browser.close()
  saveJSON(path.join(OUT, 'network', 'run-summary.json'), {
    ...runMeta,
    finishedAt: new Date().toISOString(),
  })
  console.log('done')
})().catch((e) => {
  console.error('PROBE FAILED:', e && e.stack ? e.stack : e)
  process.exit(1)
})
