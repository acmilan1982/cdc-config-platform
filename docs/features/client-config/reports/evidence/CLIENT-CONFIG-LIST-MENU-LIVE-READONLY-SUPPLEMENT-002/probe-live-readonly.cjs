/**
 * Read-only live probe for /config/client (list + three-state menu observations).
 *
 * Boundaries enforced here:
 * - Browser-context route gate: GET/HEAD/OPTIONS allowed; every other method aborted and counted.
 * - Only opens row menus and the enable/disable confirmation dialogs, then cancels them.
 * - Never clicks a final confirm button, never triggers an enable/disable/delete request.
 * - Output is desensitized: stable aliases T01..Tnn only; no real IDs/descriptions/orgs.
 * - Raw API sample and ID mapping stay outside the repository.
 */
const fs = require('fs')
const path = require('path')

const PW_CANDIDATES = [
  '/root/.hermes/hermes-agent/node_modules/playwright-core',
  '/usr/lib/node_modules/openclaw/node_modules/playwright-core',
  '/data/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright-core',
]
let chromium
for (const p of PW_CANDIDATES) {
  try { chromium = require(p).chromium; break } catch (e) {}
}
if (!chromium) { console.error('no playwright-core'); process.exit(2) }

const EXE = process.env.PROBE_CHROME || '/root/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome'
const FRONT = process.env.PROBE_FRONT || 'http://127.0.0.1:5173'
const RAW_PATH = process.env.PROBE_RAW || '/tmp/live-supp002/clients.json'
const OUT = process.argv[2] || path.join(__dirname, 'live-readonly-results.json')

const raw = JSON.parse(fs.readFileSync(RAW_PATH, 'utf8'))
const items = (raw && raw.data && raw.data.items) || []
const aliasOf = new Map()
const stateOf = new Map()
const aliasState = new Map()
items.forEach((c, i) => {
  const alias = 'T' + String(i + 1).padStart(2, '0')
  const st = c.fgActive === '1' ? 'enabled' : c.fgActive === '0' ? 'disabled' : 'abnormal'
  aliasOf.set(c.clientId, alias)
  stateOf.set(c.clientId, st)
  aliasState.set(alias, st)
})
const counts = { exact_1: 0, exact_0: 0, abnormal_non_0_1: 0 }
for (const c of items) {
  if (c.fgActive === '1') counts.exact_1++
  else if (c.fgActive === '0') counts.exact_0++
  else counts.abnormal_non_0_1++
}
const firstDisabled = items.find((c) => c.fgActive === '0')
const firstEnabled = items.find((c) => c.fgActive === '1')

const result = {
  task: 'CLIENT-CONFIG-LIST-MENU-LIVE-READONLY-SUPPLEMENT-002',
  mode: 'readonly-live-browser-probe',
  base: '1c87312f8afb5ba4e4367120b4ace6b7dfa96216',
  frontend: FRONT,
  browser: { engine: 'chromium', executable: EXE, headless: true },
  gate: {
    policy: '/api/** GET/HEAD/OPTIONS allow; other methods abort+count',
    nonGetAttempts: 0,
    attempts: [],
  },
  sample: {
    totalRows: items.length,
    fgActiveCounts: counts,
    aliases: items.map((c) => ({ alias: aliasOf.get(c.clientId), state: stateOf.get(c.clientId) })),
    note: 'Sample read live before the browser probe; counts are exact string FG_ACTIVE classification.',
  },
  viewports: {},
}

async function classifyRow(page, clientId) {
  const ids = await page.$$eval('.cc-table tr.el-table__row .cc-id', (els) => els.map((e) => (e.textContent || '').trim()))
  return ids.indexOf(clientId)
}

async function rowFacts(page, clientId) {
  const idx = await classifyRow(page, clientId)
  const row = page.locator('.cc-table tr.el-table__row').nth(idx)
  return {
    idx,
    alias: aliasOf.get(clientId),
    state: stateOf.get(clientId),
    hasInactiveMark: (await row.locator('.cc-inactive-mark').count()) > 0,
    hasAbnormalMark: (await row.locator('.cc-abnormal-mark').count()) > 0,
  }
}

async function fixedSelectionCount(page) {
  return page.locator('.cc-table tr.lt-row-highlight__row').count()
}

async function editDialogVisible(page) {
  const d = page.locator('.el-dialog.cc-dialog')
  return (await d.count()) > 0 && (await d.first().isVisible())
}

async function closePopper(page) {
  await page.keyboard.press('Escape').catch(() => {})
  await page.waitForTimeout(150)
}

async function openMenu(page, clientId) {
  const idx = await classifyRow(page, clientId)
  const row = page.locator('.cc-table tr.el-table__row').nth(idx)
  await row.locator('.cc-more-link').click()
  await page.locator('.cc-more-popper .el-dropdown-menu__item:visible').first().waitFor({ state: 'visible', timeout: 5000 })
  const itemTexts = await page.locator('.cc-more-popper .el-dropdown-menu__item:visible').allInnerTexts()
  return {
    alias: aliasOf.get(clientId),
    itemTexts: itemTexts.map((s) => s.trim()).filter(Boolean),
    editDialogOpened: await editDialogVisible(page),
    fixedSelectedRowsAfterOpen: await fixedSelectionCount(page),
  }
}

async function clickMenuItem(page, text) {
  await page.locator('.cc-more-popper .el-dropdown-menu__item:visible', { hasText: text }).first().click()
}

async function captureMessageBox(page, cls) {
  const box = page.locator(`.el-message-box.${cls}`)
  await box.waitFor({ state: 'visible', timeout: 5000 })
  const title = (await box.locator('.el-message-box__title').innerText()).trim()
  const message = (await box.locator('.el-message-box__message').innerText()).trim()
  const buttons = (await box.locator('.el-message-box__btns button').allInnerTexts()).map((s) => s.trim()).filter(Boolean)
  return { title, message, buttons }
}

async function cancelMessageBox(page, cls) {
  const box = page.locator(`.el-message-box.${cls}`)
  await box.locator('.el-message-box__btns button', { hasText: '取消' }).first().click()
  await box.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {})
  await page.waitForTimeout(150)
}

async function runViewport(browser, vp) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1 })
  const attempts = []
  await ctx.route('**/api/**', (route) => {
    const req = route.request()
    const method = req.method()
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return route.continue()
    let p = ''
    try { p = new URL(req.url()).pathname } catch (e) { p = '/api/?' }
    attempts.push({ method, path: p })
    return route.abort()
  })
  const page = await ctx.newPage()
  const out = { gate: { nonGetAttempts: 0, attempts }, structure: {}, markers: {}, menus: {}, events: {}, confirmations: {} }
  try {
    await page.goto(`${FRONT}/config/client`, { waitUntil: 'networkidle' })
    await page.waitForSelector('.cc-table .el-table__body tr.el-table__row')
    await page.waitForTimeout(500)

    // ---------- structure ----------
    out.structure = await page.evaluate(() => {
      const headers = Array.from(document.querySelectorAll('.cc-table thead th.el-table__cell .cell'))
        .map((e) => (e.textContent || '').trim())
      const th = document.querySelector('.cc-table th.lt-row-action__cell')
      const td = document.querySelector('.cc-table td.lt-row-action__cell')
      const ths = th ? getComputedStyle(th) : null
      const tds = td ? getComputedStyle(td) : null
      const wrap = document.querySelector('.cc-table .el-scrollbar__wrap') || document.querySelector('.cc-table .el-table__body-wrapper')
      return {
        headers,
        hasStatusColumn: headers.includes('状态'),
        headersRightmost: headers.length ? headers[headers.length - 1] : null,
        actionColClassPresent: !!th && !!td,
        fixedCol: {
          th: ths ? { position: ths.position, right: ths.right } : null,
          td: tds ? { position: tds.position, right: tds.right } : null,
        },
        horizontal: wrap ? { scrollWidth: wrap.scrollWidth, clientWidth: wrap.clientWidth, overflow: wrap.scrollWidth > wrap.clientWidth + 1 } : null,
      }
    })

    // ---------- horizontal scroll check (only if overflow) ----------
    if (out.structure.horizontal && out.structure.horizontal.overflow) {
      out.structure.horizontal = await page.evaluate(() => {
        const wrap = document.querySelector('.cc-table .el-scrollbar__wrap') || document.querySelector('.cc-table .el-table__body-wrapper')
        const max = wrap.scrollWidth - wrap.clientWidth
        wrap.scrollLeft = max
        const td = document.querySelector('.cc-table td.lt-row-action__cell')
        const th = document.querySelector('.cc-table th.lt-row-action__cell')
        const r = td ? td.getBoundingClientRect() : null
        const rt = th ? th.getBoundingClientRect() : null
        const res = {
          scrollWidth: wrap.scrollWidth,
          clientWidth: wrap.clientWidth,
          overflow: true,
          scrolledToMax: Math.round(wrap.scrollLeft) >= max - 1,
          actionTdVisibleAtMaxScroll: !!r && r.width > 0 && r.right <= window.innerWidth + 1 && r.left >= -1,
          actionThVisibleAtMaxScroll: !!rt && rt.width > 0 && rt.right <= window.innerWidth + 1 && rt.left >= -1,
        }
        wrap.scrollLeft = 0
        return res
      })
    } else if (out.structure.horizontal) {
      out.structure.horizontal = { ...out.structure.horizontal, scrolledToMax: false, actionTdVisibleAtMaxScroll: null, actionTdVisibleWithoutOverflow: true }
    }

    // ---------- markers ----------
    const markerFacts = await page.evaluate((map) => {
      const rows = Array.from(document.querySelectorAll('.cc-table .el-table__body tr.el-table__row'))
      return rows.map((tr) => {
        const id = (tr.querySelector('.cc-id')?.textContent || '').trim()
        return {
          alias: map[id] || null,
          hasInactiveMark: !!tr.querySelector('.cc-inactive-mark'),
          hasAbnormalMark: !!tr.querySelector('.cc-abnormal-mark'),
        }
      })
    }, Object.fromEntries(aliasOf))
    out.markers = {
      rows: markerFacts,
      disabledRowsWithMark: markerFacts.filter((r) => r.alias && aliasState.get(r.alias) === 'disabled' && r.hasInactiveMark).length,
      disabledRowsWithoutMark: markerFacts.filter((r) => r.alias && aliasState.get(r.alias) === 'disabled' && !r.hasInactiveMark).length,
      enabledRowsWithMark: markerFacts.filter((r) => r.alias && aliasState.get(r.alias) === 'enabled' && r.hasInactiveMark).length,
      abnormalRowsWithMark: markerFacts.filter((r) => r.hasAbnormalMark).length,
    }

    // ---------- hover vs fixed selection ----------
    const row0 = page.locator('.cc-table tr.el-table__row').first()
    const bgBefore = await row0.locator('td').first().evaluate((td) => getComputedStyle(td).backgroundColor)
    await row0.hover()
    await page.waitForTimeout(120)
    const bgHover = await row0.locator('td').first().evaluate((td) => getComputedStyle(td).backgroundColor)
    const fixedDuringHover = await fixedSelectionCount(page)
    await page.mouse.move(5, 5)
    await page.waitForTimeout(700)
    const bgAfter = await row0.locator('td').first().evaluate((td) => getComputedStyle(td).backgroundColor)
    out.events.hover = {
      backgroundColorBefore: bgBefore,
      backgroundColorDuringHover: bgHover,
      backgroundColorAfter: bgAfter,
      hoverChangedBackground: bgBefore !== bgHover,
      hoverReverted: bgBefore === bgAfter,
      fixedSelectedRowsDuringHover: fixedDuringHover,
    }

    // ---------- disabled-row menu + enable confirmation (cancel only) ----------
    if (firstDisabled) {
      out.menus.disabledRow = await openMenu(page, firstDisabled.clientId)
      out.menus.disabledRow.containsDelete = out.menus.disabledRow.itemTexts.includes('删除')
      out.menus.disabledRow.containsEnable = out.menus.disabledRow.itemTexts.includes('启用')
      out.menus.disabledRow.containsDisable = out.menus.disabledRow.itemTexts.includes('停用')
      const before = attempts.length
      await clickMenuItem(page, '启用')
      const box = await captureMessageBox(page, 'cc-confirm--enable')
      out.confirmations.enable = {
        openedAfterMenuClick: true,
        title: box.title,
        bodyContainsExactId: box.message.includes(firstDisabled.clientId),
        bodyMasked: box.message.replace(firstDisabled.clientId, '<ID>'),
        buttons: box.buttons,
        editDialogOpenedByMenuItemClick: await editDialogVisible(page),
        fixedSelectedRowsWhileOpen: await fixedSelectionCount(page),
      }
      await cancelMessageBox(page, 'cc-confirm--enable')
      out.confirmations.enable.nonGetAttemptsDelta = attempts.length - before
      out.confirmations.enable.messageBoxHiddenAfterCancel = (await page.locator('.el-message-box.cc-confirm--enable').count()) === 0 || !(await page.locator('.el-message-box.cc-confirm--enable').first().isVisible())
      out.confirmations.enable.fixedSelectedRowsAfterCancel = await fixedSelectionCount(page)
      out.confirmations.enable.editDialogOpenedAfterCancel = await editDialogVisible(page)
      await closePopper(page)
    }

    // ---------- enabled-row menu + disable confirmation (cancel only) ----------
    if (firstEnabled) {
      out.menus.enabledRow = await openMenu(page, firstEnabled.clientId)
      out.menus.enabledRow.containsDelete = out.menus.enabledRow.itemTexts.includes('删除')
      out.menus.enabledRow.containsEnable = out.menus.enabledRow.itemTexts.includes('启用')
      out.menus.enabledRow.containsDisable = out.menus.enabledRow.itemTexts.includes('停用')
      const before = attempts.length
      await clickMenuItem(page, '停用')
      const box = await captureMessageBox(page, 'cc-confirm--disable')
      out.confirmations.disable = {
        openedAfterMenuClick: true,
        title: box.title,
        bodyContainsExactId: box.message.includes(firstEnabled.clientId),
        bodyMasked: box.message.replace(firstEnabled.clientId, '<ID>'),
        buttons: box.buttons,
        editDialogOpenedByMenuItemClick: await editDialogVisible(page),
        fixedSelectedRowsWhileOpen: await fixedSelectionCount(page),
      }
      await cancelMessageBox(page, 'cc-confirm--disable')
      out.confirmations.disable.nonGetAttemptsDelta = attempts.length - before
      out.confirmations.disable.messageBoxHiddenAfterCancel = (await page.locator('.el-message-box.cc-confirm--disable').count()) === 0 || !(await page.locator('.el-message-box.cc-confirm--disable').first().isVisible())
      out.confirmations.disable.fixedSelectedRowsAfterCancel = await fixedSelectionCount(page)
      out.confirmations.disable.editDialogOpenedAfterCancel = await editDialogVisible(page)
      await closePopper(page)
    }

    // ---------- abnormal-row menu: not executable with current sample ----------
    out.menus.abnormalRow = 'NOT_EXECUTED_NO_ABNORMAL_FG_ACTIVE_ROW_IN_CURRENT_SAMPLE'

    // ---------- double-click trigger must not edit / select ----------
    const dblTarget = firstDisabled || firstEnabled
    if (dblTarget) {
      const idx = await classifyRow(page, dblTarget.clientId)
      await page.locator('.cc-table tr.el-table__row').nth(idx).locator('.cc-more-link').dblclick()
      await page.waitForTimeout(400)
      out.events.triggerDoubleClick = {
        editDialogOpened: await editDialogVisible(page),
        fixedSelectedRows: await fixedSelectionCount(page),
      }
      await closePopper(page)
    }

    // ---------- menu container click (padding area) ----------
    if (dblTarget) {
      const idx = await classifyRow(page, dblTarget.clientId)
      await page.locator('.cc-table tr.el-table__row').nth(idx).locator('.cc-more-link').click()
      const menu = page.locator('.cc-more-popper .el-dropdown-menu:visible').first()
      await menu.waitFor({ state: 'visible' })
      const boxRect = await menu.boundingBox()
      if (boxRect) {
        await page.mouse.click(boxRect.x + 2, boxRect.y + 2)
        await page.waitForTimeout(250)
      }
      out.events.menuContainerClick = {
        editDialogOpened: await editDialogVisible(page),
        fixedSelectedRows: await fixedSelectionCount(page),
        confirmBoxOpened: (await page.locator('.el-message-box:visible').count()) > 0,
      }
      await closePopper(page)
      if ((await page.locator('.el-message-box:visible').count()) > 0) {
        await page.keyboard.press('Escape').catch(() => {})
      }
    }

    out.final = {
      nonGetAttempts: attempts.length,
      editDialogOpened: await editDialogVisible(page),
      fixedSelectedRows: await fixedSelectionCount(page),
    }
  } finally {
    result.viewports[vp.name] = out
    result.gate.nonGetAttempts += attempts.length
    result.gate.attempts.push(...attempts)
    await ctx.close()
  }
}

;(async () => {
  const browser = await chromium.launch({ executablePath: EXE, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--no-proxy-server'] })
  try {
    for (const vp of [{ name: '1440x900', width: 1440, height: 900 }, { name: '1920x1080', width: 1920, height: 1080 }]) {
      await runViewport(browser, vp)
    }
  } finally {
    await browser.close()
  }
  fs.writeFileSync(OUT, JSON.stringify(result, null, 2) + '\n')
  console.log('WROTE ' + OUT)
  console.log('nonGetAttempts=' + result.gate.nonGetAttempts)
})().catch((e) => { console.error(e); process.exit(1) })
