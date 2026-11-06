#!/usr/bin/env node
/*
 * CLIENT-CONFIG-DIALOG-ACCEPTANCE-005 — Probe B (controlled write window)
 *
 * Scope: /config/client only. Gate before first navigation:
 *   GET/HEAD/OPTIONS forwarded.
 *   POST /api/clients is forwarded only when the parsed body carries the exact synthetic
 *   clientId CCFG005-NEW and either:
 *     - dataSourceIds == ['CCFG005-DS-LONG-0123456789ABCDE']  -> forwarded immediately (expected 40941)
 *     - dataSourceIds == ['CCFG-AC-R1-DS06']                  -> delayed 5000 ms, then forwarded (busy window)
 *   Every other non-GET business request is aborted and counted.
 *
 * Auxiliary setup writes (CCFG005-OCC1/OCC2) are performed with Node fetch outside the page,
 * with exact synthetic IDs/bodies, and are recorded separately as direct writes.
 *
 * Covers: AC-120 create busy state / anti-duplicate / no blue-black jump; AC-125 long real
 * backend field-level error readability; AC-138 long-error branch stability; AC-134 create
 * failure + correction + real save readback.
 */
const { chromium } = require('/root/.hermes/hermes-agent/node_modules/playwright-core')
const fs = require('fs')
const path = require('path')

const BASE = 'http://127.0.0.1:5173'
const API = 'http://127.0.0.1:8080'
const OUT = path.resolve(__dirname, '..', 'results', 'probeB-write.json')
const CHROME = '/root/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome'

const LONG_ID = 'CCFG005-DS-LONG-0123456789ABCDE'
const OCC1 = 'CCFG005-OCC1'
const NEW_ID = 'CCFG005-NEW'
const SAFE_SOURCE = 'CCFG-AC-R1-DS06'
const EXCLUDED_IDS = ['CCFG005-DS-OFF', 'CCFG005-DS-ABN', 'CCFG005-DS-CAT', 'CCFG005-DS-TYP']
const EXPECTED_MSG = '数据源“CCFG005超长机构名称用于错误换行验证样本（CCFG005-DS-LONG-0123456789ABCDE）”已分配给探针：CCFG005-OCC1，不能重复分配。'

const result = {
  meta: {
    probe: 'probeB-write',
    startedAt: new Date().toISOString(),
    base: BASE,
    gate: 'strict POST /api/clients whitelist by synthetic clientId + exact dataSourceIds; all other non-GET aborted',
    pageScope: '/config/client only',
  },
  gate: { forwarded: [], aborted: [], apiRequests: [], responses: [] },
  directWrites: [],
  sections: {},
}

function save() {
  fs.mkdirSync(path.dirname(OUT), { recursive: true })
  fs.writeFileSync(OUT, JSON.stringify(result, null, 2))
}

async function postClient(body) {
  const started = Date.now()
  const res = await fetch(`${API}/api/clients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => null)
  return { status: res.status, body: json, ms: Date.now() - started, request: body }
}

async function main() {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE })

  const state = { conflictForwarded: 0, successForwarded: 0, successStartedAt: null }
  await context.route('**/api/**', async (route) => {
    const req = route.request()
    const method = req.method().toUpperCase()
    const pathname = new URL(req.url()).pathname
    result.gate.apiRequests.push({ method, path: pathname })
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return route.continue()
    if (method === 'POST' && pathname === '/api/clients') {
      let body = null
      try { body = JSON.parse(req.postData() || 'null') } catch { body = null }
      const ids = body && Array.isArray(body.dataSourceIds) ? body.dataSourceIds : null
      const sameIds = (want) => ids && ids.length === want.length && ids.every((v, i) => v === want[i])
      if (body && body.clientId === NEW_ID && sameIds([LONG_ID])) {
        state.conflictForwarded += 1
        result.gate.forwarded.push({ kind: 'conflict', method, path: pathname, body })
        return route.continue()
      }
      if (body && body.clientId === NEW_ID && sameIds([SAFE_SOURCE])) {
        state.successForwarded += 1
        state.successStartedAt = Date.now()
        result.gate.forwarded.push({ kind: 'success-busy', method, path: pathname, body, delayMs: 5000 })
        await new Promise((r) => setTimeout(r, 5000))
        return route.continue()
      }
    }
    result.gate.aborted.push({ method, path: pathname, postData: req.postData() })
    return route.abort()
  })

  const page = await context.newPage()
  page.on('response', async (res) => {
    const req = res.request()
    if (req.method().toUpperCase() !== 'POST' || new URL(res.url()).pathname !== '/api/clients') return
    let respBody = null
    try { respBody = await res.json() } catch {}
    let requestBody = null
    try { requestBody = JSON.parse(req.postData() || 'null') } catch {}
    result.gate.responses.push({ status: res.status(), path: new URL(res.url()).pathname, requestBody, body: respBody })
  })
  page.setDefaultTimeout(30000)
  await page.goto(`${BASE}/config/client`, { waitUntil: 'networkidle' })
  await page.waitForSelector('.el-table__row')

  const submitButton = () => page.locator('.cc-dialog-submit')
  const feedbackText = () => page.locator('.cc-source-field .cc-field-feedback__text')

  async function styleOf(loc) {
    return loc.evaluate((el) => {
      const s = getComputedStyle(el)
      return {
        backgroundColor: s.backgroundColor, borderColor: s.borderTopColor, color: s.color,
        borderRadius: s.borderRadius, fontWeight: s.fontWeight, cursor: s.cursor, pointerEvents: s.pointerEvents,
      }
    })
  }

  async function buttonState(label) {
    const btn = submitButton()
    const className = await btn.getAttribute('class')
    return {
      label,
      text: (await btn.innerText()).trim(),
      className,
      hasIsLoadingClass: /is-loading/.test(className || ''),
      hasIsDisabledClass: /is-disabled/.test(className || ''),
      disabledAttr: await btn.isDisabled(),
      spinnerCount: await btn.locator('.is-loading, .el-icon.is-loading, .el-loading-spinner').count().catch(() => 0),
      style: await styleOf(btn),
    }
  }

  async function measureError(label) {
    return page.evaluate((label) => {
      const q = (s) => document.querySelector(s)
      const rect = (el) => {
        if (!el) return null
        const r = el.getBoundingClientRect()
        return { top: +r.top.toFixed(2), left: +r.left.toFixed(2), right: +r.right.toFixed(2), bottom: +r.bottom.toFixed(2), width: +r.width.toFixed(2), height: +r.height.toFixed(2) }
      }
      const p = q('.cc-source-field .cc-field-feedback__text')
      const box = q('.cc-source-field .cc-field-feedback')
      const form = q('.cc-form')
      const dialog = q('.el-dialog.cc-dialog')
      const submit = q('.cc-dialog-submit')
      const docEl = document.documentElement
      let lines = []
      if (p && p.firstChild) {
        const range = document.createRange()
        range.selectNodeContents(p)
        lines = Array.from(range.getClientRects()).map((r) => ({ top: +r.top.toFixed(2), left: +r.left.toFixed(2), width: +r.width.toFixed(2), height: +r.height.toFixed(2) }))
      }
      const ancestors = []
      let node = p
      while (node && node !== document.body) {
        const cs = getComputedStyle(node)
        ancestors.push({
          tag: node.tagName, cls: String(node.className || '').slice(0, 100),
          clientWidth: node.clientWidth, scrollWidth: node.scrollWidth,
          clientHeight: node.clientHeight, scrollHeight: node.scrollHeight,
          overflowX: cs.overflowX, overflowY: cs.overflowY,
        })
        node = node.parentElement
      }
      const csP = p ? getComputedStyle(p) : null
      return {
        label,
        viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
        text: p ? p.textContent : null,
        toneClass: p ? p.className : null,
        pStyle: csP ? { fontSize: csP.fontSize, lineHeight: csP.lineHeight, color: csP.color, overflow: csP.overflow, overflowWrap: csP.overflowWrap, height: csP.height, whiteSpace: csP.whiteSpace } : null,
        pRect: rect(p),
        boxRect: rect(box),
        lineCount: lines.length,
        lines,
        ancestors,
        form: form ? { top: +form.getBoundingClientRect().top.toFixed(2), bottom: +form.getBoundingClientRect().bottom.toFixed(2), clientHeight: form.clientHeight, scrollHeight: form.scrollHeight, scrollTop: form.scrollTop, overflowY: getComputedStyle(form).overflowY, maxHeight: getComputedStyle(form).maxHeight } : null,
        dialog: rect(dialog),
        submit: rect(submit),
        submitDisabled: submit ? submit.disabled : null,
        doc: { scrollWidth: docEl.scrollWidth, clientWidth: docEl.clientWidth, horizontalOverflow: docEl.scrollWidth > docEl.clientWidth },
        sourceSplitClass: q('.cc-split') ? q('.cc-split').className : null,
      }
    }, label)
  }

  async function scrollFormToFeedback() {
    const info = await page.evaluate(() => {
      const form = document.querySelector('.cc-form')
      const p = document.querySelector('.cc-source-field .cc-field-feedback__text')
      if (!form || !p) return null
      form.scrollTop = form.scrollHeight
      const fr = form.getBoundingClientRect()
      const pr = p.getBoundingClientRect()
      const range = document.createRange()
      range.selectNodeContents(p)
      const lines = Array.from(range.getClientRects()).map((r) => ({
        top: +r.top.toFixed(2), bottom: +r.bottom.toFixed(2),
        insideFormViewport: r.top >= fr.top - 0.5 && r.bottom <= fr.bottom + 0.5,
      }))
      return {
        formRect: { top: +fr.top.toFixed(2), bottom: +fr.bottom.toFixed(2) },
        pRect: { top: +pr.top.toFixed(2), bottom: +pr.bottom.toFixed(2) },
        fullyInsideFormViewport: pr.top >= fr.top - 0.5 && pr.bottom <= fr.bottom + 0.5,
        lines,
        formScrollTop: form.scrollTop,
      }
    })
    await page.waitForTimeout(300)
    return info
  }

  // ------------------------------------------------------------ open create, select long source before occupation
  await page.click('.cc-btn-add')
  await page.waitForSelector('.el-dialog.cc-dialog', { state: 'visible' })
  await page.waitForFunction(() => document.querySelectorAll('.cc-opt').length > 0)
  await page.waitForTimeout(400)

  const longOpt = page.locator('.cc-opt').filter({ hasText: LONG_ID }).first()
  const longOptionBeforeOccupation = {
    present: await longOpt.count() > 0,
    disabled: await longOpt.isDisabled().catch(() => null),
    reason: await longOpt.locator('.cc-opt-reason').count() ? (await longOpt.locator('.cc-opt-reason').innerText()).trim() : null,
  }

  const optionsBefore = await fetch(`${API}/api/clients/data-source-options`).then((r) => r.json())
  const longBefore = optionsBefore.data.find((x) => x.dataSourceId === LONG_ID)
  const excludedPresent = EXCLUDED_IDS.filter((id) => optionsBefore.data.some((x) => x.dataSourceId === id))

  await page.locator('.cc-id-control .el-input__inner').fill(NEW_ID)
  await page.locator('.cc-desc-row textarea').fill('CCFG005 dialog create synthetic sample')
  await longOpt.scrollIntoViewIfNeeded()
  await longOpt.click()
  await page.waitForTimeout(300)
  result.sections.setup = {
    longOptionBeforeOccupation,
    apiBeforeOccupation: {
      long: longBefore,
      excludedPresent,
      excludedIdsChecked: EXCLUDED_IDS,
      total: optionsBefore.data.length,
    },
    chosen: await page.evaluate(() => Array.from(document.querySelectorAll('.cc-chosen-list .cc-chip')).map((e) => e.textContent.trim())),
    optionsLoadedBeforeOccupation: true,
  }
  save()

  // ------------------------------------------------------------ auxiliary occupier write (direct fetch, outside the page)
  result.directWrites.push(await postClient({ clientId: OCC1, clientDesc: 'CCFG005 synthetic occupier', dataSourceIds: [LONG_ID] }))
  save()

  // options API now reports the source occupied (independent read)
  const optionsAfter = await fetch(`${API}/api/clients/data-source-options`).then((r) => r.json())
  result.sections.setup.optionsAfterOccupation = optionsAfter.data.find((x) => x.dataSourceId === LONG_ID)

  // ------------------------------------------------------------ AC-125/138: real backend 40941 long error, wide viewport
  await submitButton().click()
  await page.waitForFunction(() => {
    const p = document.querySelector('.cc-source-field .cc-field-feedback__text')
    return p && /不能重复分配/.test(p.textContent || '')
  }, null, { timeout: 30000 })
  await page.waitForTimeout(500)
  result.sections.conflict = {
    expectedMessage: EXPECTED_MSG,
    messageMatches: (await feedbackText().innerText()).trim() === EXPECTED_MSG,
    wideBeforeScroll: await measureError('wide-before-scroll'),
  }
  result.sections.conflict.wideScroll = await scrollFormToFeedback()
  result.sections.conflict.wideAfterScroll = await measureError('wide-after-scroll')
  save()

  // narrow viewport with the same dialog/error still open
  await page.setViewportSize({ width: 1024, height: 720 })
  await page.waitForTimeout(600)
  result.sections.conflict.narrowBeforeScroll = await measureError('narrow-before-scroll')
  result.sections.conflict.narrowScroll = await scrollFormToFeedback()
  result.sections.conflict.narrowAfterScroll = await measureError('narrow-after-scroll')
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.waitForTimeout(500)
  save()

  // ------------------------------------------------------------ correction: remove conflict source, pick safe source
  await page.locator('.cc-chosen-list .cc-chip .el-tag__close, .cc-chosen-list .cc-chip .el-icon').first().click()
  await page.waitForTimeout(300)
  const afterRemove = {
    feedbackText: await feedbackText().count() ? (await feedbackText().first().innerText()).trim() : null,
    chosenCount: await page.locator('.cc-chosen-list .cc-chip').count(),
  }
  const safeOpt = page.locator('.cc-opt').filter({ hasText: SAFE_SOURCE }).first()
  await safeOpt.scrollIntoViewIfNeeded()
  await safeOpt.click()
  await page.waitForTimeout(300)
  result.sections.correction = {
    afterRemove,
    afterSelectSafe: {
      feedbackText: await feedbackText().count() ? (await feedbackText().first().innerText()).trim() : null,
      feedbackCount: await feedbackText().count(),
      chosen: await page.evaluate(() => Array.from(document.querySelectorAll('.cc-chosen-list .cc-chip')).map((e) => e.textContent.trim())),
      submitDisabled: await submitButton().isDisabled(),
    },
  }
  save()

  // ------------------------------------------------------------ AC-120 create busy window + AC-134 real save
  await page.evaluate(() => {
    window.__ccfg005Toasts = []
    const obs = new MutationObserver(() => {
      document.querySelectorAll('.el-message__content').forEach((el) => {
        const t = (el.textContent || '').trim()
        if (t && !window.__ccfg005Toasts.includes(t)) window.__ccfg005Toasts.push(t)
      })
    })
    obs.observe(document.body, { childList: true, subtree: true })
  })
  const t0 = Date.now()
  await submitButton().click()
  await page.waitForFunction(() => document.querySelector('.cc-dialog-submit')?.classList.contains('is-loading'), null, { timeout: 5000 })
  const busySnapshots = []
  busySnapshots.push({ atMs: Date.now() - t0, ...(await buttonState('busy-early')), hit: await page.evaluate(() => {
    const b = document.querySelector('.cc-dialog-submit')
    const r = b.getBoundingClientRect()
    const el = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)
    return el ? { tag: el.tagName, cls: String(el.className || '').slice(0, 120) } : null
  }) })
  // duplicate real mouse click at the busy button
  const btnBox = await submitButton().boundingBox()
  await page.mouse.click(btnBox.x + btnBox.width / 2, btnBox.y + btnBox.height / 2)
  await page.waitForTimeout(250)
  busySnapshots.push({ atMs: Date.now() - t0, note: 'after duplicate click', ...(await buttonState('busy-after-duplicate-click')) })
  // attempt repeated input while busy
  const inputBefore = await page.locator('.cc-id-control .el-input__inner').inputValue()
  await page.locator('.cc-id-control .el-input__inner').focus().catch(() => {})
  await page.keyboard.type('ZZ').catch(() => {})
  const inputAfter = await page.locator('.cc-id-control .el-input__inner').inputValue()
  await page.waitForTimeout(1500)
  busySnapshots.push({ atMs: Date.now() - t0, ...(await buttonState('busy-mid')), typedWhileBusy: { inputBefore, inputAfter, unchanged: inputBefore === inputAfter } })
  await page.waitForTimeout(1500)
  busySnapshots.push({ atMs: Date.now() - t0, ...(await buttonState('busy-late')) })
  result.sections.busy = {
    gateDelayMs: 5000,
    gateStartedAt: state.successStartedAt,
    isRealHttpDelay: true,
    snapshots: busySnapshots,
    distinctBackgrounds: Array.from(new Set(busySnapshots.map((s) => s.style.backgroundColor))),
    blueDetected: busySnapshots.some((s) => /rgb\(\s*\d+\s*,\s*\d+\s*,\s*2[0-9]{2}\s*\)/.test(s.style.backgroundColor || '')),
    successForwardedCount: state.successForwarded,
  }
  save()

  // wait for response + dialog close
  await page.waitForFunction(() => {
    const d = document.querySelector('.el-dialog.cc-dialog')
    return !d || getComputedStyle(d).display === 'none' || !document.querySelector('.el-overlay')
  }, null, { timeout: 30000 }).catch(() => {})
  await page.waitForTimeout(1200)
  result.sections.busy.afterResponse = {
    dialogVisible: await page.locator('.el-dialog.cc-dialog').isVisible().catch(() => false),
    toast: await page.locator('.el-message__content').count() ? (await page.locator('.el-message__content').first().innerText()).trim() : null,
    observedToasts: await page.evaluate(() => window.__ccfg005Toasts || []),
    gateForwardedTotal: state.conflictForwarded + state.successForwarded,
  }
  save()

  // ------------------------------------------------------------ independent readback
  const list = await fetch(`${API}/api/clients?status=ALL`).then((r) => r.json())
  const created = (list.data.items || []).find((x) => x.clientId === NEW_ID)
  const domRow = await page.evaluate((id) => {
    const row = Array.from(document.querySelectorAll('.el-table__row')).find((r) => r.textContent.includes(id))
    return row ? row.innerText.replace(/\s+/g, ' ').trim() : null
  }, NEW_ID)
  result.sections.readback = {
    api: created ? {
      clientId: created.clientId,
      clientDesc: created.clientDesc,
      fgActive: created.fgActive,
      status: created.status,
      dataSources: (created.dataSources || []).map((d) => ({ dataSourceId: d.dataSourceId, org: d.org })),
      rawDataSourceIds: created.rawDataSourceIds,
    } : null,
    listRowText: domRow,
  }
  result.sections.requestLedger = {
    conflictForwardedCount: state.conflictForwarded,
    successForwardedCount: state.successForwarded,
    aborted: result.gate.aborted,
    apiRequestMethods: result.gate.apiRequests.reduce((acc, r) => { acc[r.method] = (acc[r.method] || 0) + 1; return acc }, {}),
  }

  result.meta.finishedAt = new Date().toISOString()
  save()
  await browser.close()
}

main().catch(async (e) => {
  result.error = { message: String((e && e.message) || e), stack: String((e && e.stack) || '') }
  result.meta.finishedAt = new Date().toISOString()
  try { save() } catch {}
  console.error(e)
  process.exit(1)
})
