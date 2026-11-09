/**
 * CLIENT-CONFIG-AC091-ABNORMAL-STATE-LIVE-ACCEPTANCE-010
 * AC-091 异常态补测探针：/config/client（三态样本）与 /config/data-source（参考 ID 正文），
 * 1440x900 / 1920x1080 配对采集。
 *
 * 网络门禁在首次导航前安装：
 *  - 仅放行两页所需只读 GET：/api/clients、/api/clients/data-source-options、/api/data-sources
 *    及同源非 /api 静态资源；
 *  - 阻断所有业务非 GET（POST/PUT/DELETE 等）与越界 /api 请求；
 *  - 记录完整请求台账，backendNonGetForwarded 必须为 0。
 * Service Worker 在 context 创建时禁用（serviceWorkers: 'block'）。
 *
 * 异常样本已由本任务在授权下通过单行 INSERT 写入 CDC_CLIENT_MULTIPLE（fgActive='X'），
 * 随后按精确主键将合成 ID 由 CCFG010-ABN1 缩短为 CCFG010X（见 sql-fixture-ledger.txt）；
 * 本探针只读采集，不提交表单、不启停记录、不再写库。编辑弹窗仅打开验证入口后取消，不保存。
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
  clientEnabled: 'probe-001',
  clientDisabled: 'hosp-008',
  clientAbnormal: 'CCFG010X',
  clientLong: 'CCFG004-LONGID-0123456789ABCDEFG',
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

// 序列化后在页面上下文执行（只读 DOM / 计算样式 / 几何）。
function pageCollectClient091(args) {
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
  const rowByText = (textSel, text) => {
    const rows = Array.from(document.querySelectorAll('.cc-table .el-table__row'))
    return rows.find((r) => {
      const t = r.querySelector(textSel)
      return t && t.textContent.trim() === text
    }) || null
  }
  const rectCenterY = (r) => (r ? r.top + r.height / 2 : null)

  const bodyProps = [
    'color', 'font-weight', 'font-size', 'font-family', 'background-color',
    'overflow', 'text-overflow', 'white-space', 'line-height', 'letter-spacing',
  ]
  const markProps = [
    'display', 'box-sizing', 'height', 'line-height', 'padding', 'margin',
    'border', 'border-radius', 'background-color', 'color', 'font-size',
    'font-weight', 'font-family', 'max-width', 'overflow', 'text-overflow',
    'white-space', 'vertical-align',
  ]

  const describeRow = (row) => {
    if (!row) return null
    const idText = row.querySelector('.cc-id')
    const idCell = row.querySelector('.cc-col-id')
    const inactive = row.querySelector('.cc-inactive-mark')
    const abnormal = row.querySelector('.cc-abnormal-mark')
    const bg = effectiveBg(idCell)
    const idRect = rect(idText)
    const markEl = abnormal || inactive
    const markRect = rect(markEl)
    return {
      idText: idText ? idText.textContent : null,
      idRect,
      bodyStyle: style(idText, bodyProps),
      cellStyle: style(idCell, ['background-color', 'padding', 'font-size', 'font-weight', 'color']),
      effectiveCellBackground: bg,
      clientWidth: idText ? idText.clientWidth : null,
      scrollWidth: idText ? idText.scrollWidth : null,
      truncated: idText ? idText.scrollWidth > idText.clientWidth + 1 : null,
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
            separateElementFromIdBody: markEl !== idText && !idText.contains(markEl),
            idBodyContainsMarkText: idText ? idText.textContent.includes(markEl.textContent.trim()) : null,
            offsetFromIdRight: idRect ? round(markRect.left - idRect.right) : null,
            centerYDeltaFromId: idRect ? round(rectCenterY(markRect) - rectCenterY(idRect)) : null,
            markColorEqualsBodyColor:
              idText && markEl
                ? getComputedStyle(idText).color === getComputedStyle(markEl).color
                : null,
            markWeightEqualsBodyWeight:
              idText && markEl
                ? getComputedStyle(idText).fontWeight === getComputedStyle(markEl).fontWeight
                : null,
            clientWidth: markEl.clientWidth,
            scrollWidth: markEl.scrollWidth,
            clipped: markEl.scrollWidth > markEl.clientWidth + 1,
          }
        : null,
    }
  }

  const enabledRow = rowByText('.cc-id', args.clientEnabled)
  const disabledRow = rowByText('.cc-id', args.clientDisabled)
  const abnormalRow = rowByText('.cc-id', args.clientAbnormal)
  const longRow = rowByText('.cc-id', args.clientLong)

  const headers = Array.from(
    document.querySelectorAll('.cc-table .el-table__header th .cell'),
  ).map((c) => c.textContent.replace(/\s+/g, ' ').trim())

  const abnormalEl = abnormalRow ? abnormalRow.querySelector('.cc-abnormal-mark') : null
  let abnormalTooltip = null
  if (abnormalEl) {
    abnormalTooltip = {
      text: abnormalEl.textContent.trim(),
      titleAttribute: abnormalEl.getAttribute('title'),
      ariaLabel: abnormalEl.getAttribute('aria-label'),
      role: abnormalEl.getAttribute('role'),
    }
  }

  return {
    headers,
    sampleRowsFound: {
      enabled: !!enabledRow,
      disabled: !!disabledRow,
      abnormal: !!abnormalRow,
      long: !!longRow,
    },
    ac091: {
      enabled: describeRow(enabledRow),
      disabled: describeRow(disabledRow),
      abnormal: describeRow(abnormalRow),
      longId: describeRow(longRow),
      abnormalMarkerGlobalCount: document.querySelectorAll('.cc-abnormal-mark').length,
      abnormalTooltip,
      statesAvailable: {
        on: !!enabledRow,
        off: !!disabledRow,
        abnormal: !!abnormalRow,
      },
    },
  }
}

function pageCollectDataSource091(args) {
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

async function hoverTip(page, locator) {
  await locator.scrollIntoViewIfNeeded()
  const box = await locator.boundingBox()
  if (!box) return { tipVisible: null, error: 'no-box' }
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.waitForTimeout(600)
  const tip = await page.evaluate(() => {
    const el = document.querySelector('.cc-single-tip')
    if (!el) return { exists: false }
    const c = getComputedStyle(el)
    const r = el.getBoundingClientRect()
    return {
      exists: true,
      visible: c.display !== 'none' && c.visibility !== 'hidden' && r.width > 0,
      text: el.textContent.trim(),
      rect: { x: Math.round(r.x * 100) / 100, y: Math.round(r.y * 100) / 100, width: Math.round(r.width * 100) / 100, height: Math.round(r.height * 100) / 100 },
      role: el.getAttribute('role'),
    }
  })
  await page.mouse.move(2, 2)
  await page.waitForTimeout(150)
  return tip
}

async function openDialogAndCancel(page, via) {
  const dialog = page.locator('.el-dialog').filter({ hasText: '编辑探针' }).first()
  await dialog.waitFor({ state: 'visible', timeout: 10000 })
  await page.waitForTimeout(300)
  const info = await page.evaluate(() => {
    const d = document.querySelector('.el-dialog')
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
  const measured = await page.evaluate(pageCollectClient091, SAMPLE)
  for (const k of ['enabled', 'disabled', 'abnormal', 'longId']) {
    withContrast(measured.ac091[k])
  }
  out.client.measurements = measured

  // 长 ID 省略 + Tooltip（009 已覆盖，本轮同条件复核）
  const longIdEl = page.locator('.cc-id', { hasText: SAMPLE.clientLong }).first()
  out.client.longIdTooltip = await hoverTip(page, longIdEl)

  // 异常标识自身 Tooltip（原始值完整体验）
  const abnormalRowLoc = page
    .locator('.cc-table .el-table__row')
    .filter({ has: page.locator('.cc-id', { hasText: SAMPLE.clientAbnormal }) })
    .first()
  const abnormalMarkLoc = abnormalRowLoc.locator('.cc-abnormal-mark').first()
  out.client.abnormalMarkTooltip = await hoverTip(page, abnormalMarkLoc)

  // 键盘聚焦异常行 ID（不打开弹窗）
  out.client.abnormalKeyboardFocus = await page.evaluate((id) => {
    const rows = Array.from(document.querySelectorAll('.cc-table .el-table__row'))
    const row = rows.find((r) => {
      const t = r.querySelector('.cc-id')
      return t && t.textContent.trim() === id
    })
    if (!row) return { found: false }
    const el = row.querySelector('.cc-id')
    el.focus()
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
  }, SAMPLE.clientAbnormal)
  await page.mouse.move(2, 2)

  // 截图（测量与聚焦之后、双击之前）
  const enabledRowLoc = page
    .locator('.cc-table .el-table__row')
    .filter({ has: page.locator('.cc-id', { hasText: SAMPLE.clientEnabled }) })
    .first()
  const disabledRowLoc = page
    .locator('.cc-table .el-table__row')
    .filter({ has: page.locator('.cc-id', { hasText: SAMPLE.clientDisabled }) })
    .first()
  await enabledRowLoc.locator('.cc-col-id').screenshot({
    path: path.join(OUT, 'screenshots', `client-091-enabled-id-${vp.name}.png`),
  })
  await disabledRowLoc.locator('.cc-col-id').screenshot({
    path: path.join(OUT, 'screenshots', `client-091-disabled-id-${vp.name}.png`),
  })
  await abnormalRowLoc.locator('.cc-col-id').screenshot({
    path: path.join(OUT, 'screenshots', `client-091-abnormal-id-${vp.name}.png`),
  })

  // 异常行鼠标编辑入口：双击 ID
  await abnormalRowLoc.locator('.cc-id').dblclick()
  out.client.abnormalMouseEditEntry = await openDialogAndCancel(page, 'abnormal-id-dblclick')
  await page.mouse.move(2, 2)

  // 异常行键盘编辑入口：聚焦 ID + Enter
  await abnormalRowLoc.locator('.cc-id').focus()
  await page.keyboard.press('Enter')
  out.client.abnormalKeyboardEditEntry = await openDialogAndCancel(page, 'abnormal-id-focus-enter')
  await page.mouse.move(2, 2)

  // ---------- data-source reference page（只读对照 ID 正文）
  await page.goto(`${BASE}/config/data-source`, { waitUntil: 'domcontentloaded', timeout: 45000 })
  await settle(page, '.data-table .el-table__row')
  await page.mouse.move(2, 2)
  await page.waitForTimeout(250)

  out.dataSource = { env: await page.evaluate(collectEnv) }
  const dsMeasured = await page.evaluate(pageCollectDataSource091, SAMPLE)
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
    path: path.join(OUT, 'screenshots', `ds-091-enabled-id-${vp.name}.png`),
  })
  await dsInactiveLoc.locator('.ds-id-cell').screenshot({
    path: path.join(OUT, 'screenshots', `ds-091-inactive-id-${vp.name}.png`),
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
        status: r.status,
        fgActive: r.fgActive,
        clientDescPresent: r.clientDesc !== null && r.clientDesc !== undefined && r.clientDesc !== '',
        dataSourceCount: r.dataSourceCount,
        rawDataSourceIds: r.rawDataSourceIds,
        rowAnomalies: r.rowAnomalies,
        possibleCommaDataSourceIds: r.possibleCommaDataSourceIds,
        dataSources: r.dataSources.map((d) => ({
          dataSourceId: d.dataSourceId,
          anomalies: d.anomalies,
        })),
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
        enabled: pick(SAMPLE.clientEnabled),
        disabled: pick(SAMPLE.clientDisabled),
        abnormal: pick(SAMPLE.clientAbnormal),
        long: pick(SAMPLE.clientLong),
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
    task: 'CLIENT-CONFIG-AC091-ABNORMAL-STATE-LIVE-ACCEPTANCE-010',
    startedAt: new Date().toISOString(),
    baseUrl: BASE,
    browserVersion: browser.version(),
    executable: EXE,
    serviceWorkers: 'block',
    allowlistedReadOnlyApis: Array.from(READONLY_API_PATHS),
    viewports: VIEWPORTS,
    samples: SAMPLE,
    fixture: {
      clientId: 'CCFG010X',
      originalClientId: 'CCFG010-ABN1',
      fgActive: 'X',
      source: 'single-row INSERT authorized by task prompt on 2026-11-09, then exact-PK UPDATE to shorten synthetic ID',
    },
  }
  saveJSON(path.join(OUT, 'network', 'run-meta.json'), runMeta)

  for (const vp of VIEWPORTS) {
    const result = await runViewport(browser, vp)
    saveJSON(path.join(OUT, 'raw', `client-091-${vp.name}.json`), result)
    saveJSON(path.join(OUT, 'network', `ledger-${vp.name}.json`), {
      viewport: vp,
      browserVersion: result.browserVersion,
      entries: result.ledger,
      backendNonGetForwarded: result.backendNonGetForwarded,
      blockedBusinessNonGet: result.blockedBusinessNonGet,
      blockedCount: result.ledger.filter((e) => !e.allowed).length,
      allowedCount: result.ledger.filter((e) => e.allowed).length,
    })
    console.log(
      `${vp.name}: entries=${result.ledger.length} blocked=${result.ledger.filter((e) => !e.allowed).length} nonGetForwarded=${result.backendNonGetForwarded} errors=${result.errors.length}`,
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
