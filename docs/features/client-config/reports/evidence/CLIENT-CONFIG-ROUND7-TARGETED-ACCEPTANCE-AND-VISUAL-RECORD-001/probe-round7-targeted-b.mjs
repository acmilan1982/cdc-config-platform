/**
 * CLIENT-CONFIG-ROUND7-TARGETED-ACCEPTANCE-AND-VISUAL-RECORD-001 (probe B)
 * Read-only follow-up: 采集数据源 column display counts / `+N` / ambiguity marker,
 * entry hover state, and a scoped check that the opt-in helper-class rules do NOT
 * use `!important` and are limited to `.lt-main-table`.
 * Same safety boundary as probe A: non-GET `/api/**` aborted before navigation.
 */
import { chromium } from 'playwright-core'
import { writeFileSync, mkdirSync } from 'node:fs'

const FRONT = process.env.R7_FRONT || 'http://127.0.0.1:5173'
const OUT = process.env.R7_OUT || '/tmp/r7-targeted-out'
mkdirSync(OUT, { recursive: true })
const writes = []

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
await context.route('**/api/**', (route) => {
  const m = route.request().method().toUpperCase()
  if (m === 'GET' || m === 'HEAD' || m === 'OPTIONS') return route.continue()
  writes.push({ method: m, url: route.request().url() })
  return route.abort('blockedbyclient')
})
const page = await context.newPage()

async function measureAt(width, height) {
  await page.setViewportSize({ width, height })
  await page.goto(`${FRONT}/config/client`, { waitUntil: 'networkidle' })
  await page.waitForSelector('.cc-table.lt-main-table .el-table__body tr.el-table__row', { timeout: 15000 })
  return page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('.cc-table .el-table__body tr.el-table__row'))
    return rows.map((tr, i) => {
      const dsCell = tr.querySelector('td:nth-child(4)')
      const tags = dsCell ? Array.from(dsCell.querySelectorAll('.cc-dstag')) : []
      const visibleTags = tags.filter((t) => t.offsetParent !== null || getComputedStyle(t).display !== 'none')
      const more = dsCell ? dsCell.querySelector('.cc-more') : null
      const rowbad = dsCell ? dsCell.querySelector('.cc-rowbad') : null
      return {
        idx: i + 1,
        rowH: tr.getBoundingClientRect().height,
        tagTotal: tags.length,
        tagVisible: visibleTags.length,
        plusText: more ? more.textContent.trim() : null,
        plusMatchesHidden: more ? (Number(more.textContent.trim().replace('+', '')) === tags.length - visibleTags.length) : null,
        ambiguousMarker: !!rowbad,
      }
    })
  })
}

const result = {
  task: 'CLIENT-CONFIG-ROUND7-TARGETED-ACCEPTANCE-AND-VISUAL-RECORD-001',
  mode: 'readonly-browser-probe-B',
  writeInterception: { policy: 'non-GET /api/** aborted', nonGetAttempts: null },
  byWidth: {},
  scopedStyleCheck: null,
  entryHover: null,
}

try {
  result.byWidth['1920x1080'] = await measureAt(1920, 1080)
  result.byWidth['1440x900'] = await measureAt(1440, 900)
  result.byWidth['900x800'] = await measureAt(900, 800)

  // scoped !important / root-class check on the opt-in helper rules only
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(`${FRONT}/config/client`, { waitUntil: 'networkidle' })
  result.scopedStyleCheck = await page.evaluate(() => {
    const rules = []
    for (const sheet of Array.from(document.styleSheets)) {
      let list
      try { list = sheet.cssRules } catch { continue }
      for (const r of Array.from(list)) {
        const t = r.cssText || ''
        if (t.includes('lt-row-action')) rules.push({ sel: t.split('{')[0].trim(), hasImportant: /!important/.test(t) })
      }
    }
    return {
      optInRuleCount: rules.length,
      anyImportant: rules.some((r) => r.hasImportant),
      selectors: rules.map((r) => r.sel),
      allScopedToMainTable: rules.every((r) => r.sel.includes('.lt-main-table')),
      ruleCount: rules.length,
    }
  })

  // hover the first ellipsis entry and read background-color
  const entry = page.locator('.lt-row-action__ellipsis').first()
  await entry.hover()
  result.entryHover = await entry.evaluate((el) => {
    const cs = getComputedStyle(el)
    return { backgroundColor: cs.backgroundColor, color: cs.color, cursor: cs.cursor }
  })
} finally {
  result.writeInterception.nonGetAttempts = writes.length
  writeFileSync(`${OUT}/round7-targeted-results-b.json`, JSON.stringify(result, null, 1))
  await browser.close()
}
console.log('WROTE round7-targeted-results-b.json writeAttempts=', writes.length)
