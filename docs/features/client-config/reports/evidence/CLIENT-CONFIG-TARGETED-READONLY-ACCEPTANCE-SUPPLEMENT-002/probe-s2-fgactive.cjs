/**
 * CLIENT-CONFIG-TARGETED-READONLY-ACCEPTANCE-SUPPLEMENT-002
 * Addendum probe for CCFG-AC-088: correlate the VALUE shown in the row's
 * `异常：{原始值}` marker with the raw `fgActive` returned by the read-only GET,
 * row by row, at both desktop viewports.
 *
 * Safety: BEFORE the first navigation every non-GET/HEAD/OPTIONS `/api/**`
 * request is aborted at the network layer and counted. The page is opened and
 * read only; no write, no fixture, no other page.
 *
 * Desensitization: the raw `fgActive` value is NOT emitted. Only a boolean
 * per-row match plus a masked shape (length / whether it is non-standard) is
 * recorded.
 */
const PW = ['/usr/lib/node_modules/openclaw/node_modules/playwright-core',
  '/data/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright-core',
  '/root/.hermes/hermes-agent/node_modules/playwright-core']
let chromium
for (const p of PW) { try { chromium = require(p).chromium; break } catch (e) {} }
if (!chromium) { console.error('no playwright-core'); process.exit(2) }
const EXE = '/root/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome'

const FRONT = process.env.S2_FRONT || 'http://127.0.0.1:5173'
const API = process.env.S2_API || 'http://127.0.0.1:8080'
const OUT = process.env.S2_OUT || '/tmp/s2-out'
const fs = require('node:fs')
fs.mkdirSync(OUT, { recursive: true })

const writes = []
const installWriteBlocker = async (context) => {
  await context.route('**/api/**', (route) => {
    const m = route.request().method().toUpperCase()
    if (m === 'GET' || m === 'HEAD' || m === 'OPTIONS') return route.continue()
    writes.push({ method: m, url: route.request().url() })
    return route.abort('blockedbyclient')
  })
}

const MASK = (v) => ({ len: String(v).length, isStandardFlag: v === '0' || v === '1' })

async function run() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true })
  const apiClients = await (await fetch(`${API}/api/clients`)).json()
  const clients = (apiClients && apiClients.data && apiClients.data.items) || []
  const abnormal = clients.filter((c) => c.fgActive !== '0' && c.fgActive !== '1')
  // transient map clientId -> raw fgActive; never emitted
  const map = {}
  for (const c of abnormal) map[c.clientId] = c.fgActive

  const result = {
    task: 'CLIENT-CONFIG-TARGETED-READONLY-ACCEPTANCE-SUPPLEMENT-002',
    probe: 'AC-088 fgActive raw-value correlation',
    mode: 'readonly-browser-probe',
    browser: { engine: 'chromium', version: browser.version(), headless: true },
    frontend: FRONT,
    apiAbnormalCount: abnormal.length,
    apiAbnormalMasked: abnormal.map((c) => MASK(c.fgActive)),
    writeInterception: { policy: '/api/** GET/HEAD/OPTIONS allow; POST/PUT/PATCH/DELETE abort+count', nonGetAttempts: null, attempts: [] },
    viewports: {},
  }

  for (const vp of [{ name: '1440x900', width: 1440, height: 900 }, { name: '1920x1080', width: 1920, height: 1080 }]) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1 })
    await installWriteBlocker(ctx)
    const page = await ctx.newPage()
    let out
    try {
      await page.goto(`${FRONT}/config/client`, { waitUntil: 'networkidle' })
      await page.waitForSelector('.cc-table .el-table__body tr.el-table__row')
      out = await page.evaluate((m) => {
        const rows = Array.from(document.querySelectorAll('.cc-table .el-table__body tr.el-table__row'))
        const res = []
        for (const tr of rows) {
          const cid = tr.querySelector('.cc-src')?.getAttribute('data-client-id') || null
          if (!cid || !(cid in m)) continue
          const mark = tr.querySelector('.cc-abnormal-mark')
          const shown = mark ? mark.textContent.trim() : null
          const raw = m[cid]
          const expected = `异常：${raw}`
          res.push({ shownLength: shown ? shown.length : null, shownPrefix: shown ? shown.slice(0, 3) : null, matchesApi: shown === expected })
        }
        return { abnormalRowsFound: res.length, allMatch: res.length > 0 && res.every((r) => r.matchesApi), detail: res }
      }, map)
    } catch (e) {
      out = { error: String((e && e.message) || e) }
    }
    result.viewports[vp.name] = out
    await ctx.close()
  }

  result.writeInterception.nonGetAttempts = writes.length
  result.writeInterception.attempts = writes.slice(0, 20)
  await browser.close()
  fs.writeFileSync(`${OUT}/s2-fgactive-results.json`, JSON.stringify(result, null, 2))
  console.log('WROTE', `${OUT}/s2-fgactive-results.json`, 'writeAttempts=', writes.length)
}
run().catch((e) => { console.error(e); process.exit(1) })
