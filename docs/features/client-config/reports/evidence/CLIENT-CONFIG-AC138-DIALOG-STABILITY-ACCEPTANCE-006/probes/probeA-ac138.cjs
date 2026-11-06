#!/usr/bin/env node
/*
 * CLIENT-CONFIG-AC138-DIALOG-STABILITY-ACCEPTANCE-006 — Probe A
 *
 * Scope: /config/client only. Network gate installed before first navigation:
 *   GET/HEAD/OPTIONS forwarded; every other business request aborted and counted.
 *   One controlled exception: during the long-error scenes the probe intercepts
 *   POST /api/clients in the browser and replays the 005-recorded 40941 response
 *   locally. The request is NEVER forwarded to the backend.
 *
 * Covers:
 *   - 6-step stability sequence at 1920x1080 (primary) and 2560x1440 (secondary),
 *     sidebar expanded, DPR 1, 100% zoom: dialog outer box, submit button, form
 *     viewport/scroll, feedback area geometry and tone path per step.
 *   - Long 40941 error replay at both viewports (before / after / corrected),
 *     plus a 1024x720 sidebar-expanded supplement for wrap + controlled scroll.
 *   - Static layout facts read from computed styles (fixed width/height, max-height,
 *     centering relative to viewport vs content area).
 *
 * No product code, DOM or CSS is modified. No database, fixture or business write.
 */
const { chromium } = require('/root/.hermes/hermes-agent/node_modules/playwright-core')
const fs = require('fs')
const path = require('path')

const BASE = 'http://127.0.0.1:5173'
const OUT = path.resolve(__dirname, '..', 'results', 'ac138-stability.json')
const CHROME = '/root/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome'

const REPLAY = {
  source: 'docs/features/client-config/reports/evidence/CLIENT-CONFIG-DIALOG-ACCEPTANCE-005/results/probeB-write.json → gate.responses[0]',
  method: 'POST',
  path: '/api/clients',
  httpStatus: 200,
  recordedTimestamp: '2026-11-06T13:21:27.194',
  message:
    '数据源“CCFG005超长机构名称用于错误换行验证样本（CCFG005-DS-LONG-0123456789ABCDE）”已分配给探针：CCFG005-OCC1，不能重复分配。',
}
REPLAY.body = {
  code: 40941,
  message: REPLAY.message,
  data: null,
  timestamp: REPLAY.recordedTimestamp,
}

const result = {
  meta: {
    probe: 'probeA-ac138',
    task: 'CLIENT-CONFIG-AC138-DIALOG-STABILITY-ACCEPTANCE-006',
    startedAt: new Date().toISOString(),
    base: BASE,
    browser: CHROME,
    pageScope: '/config/client only',
    gate: 'context.route **/api/** — GET/HEAD/OPTIONS forwarded; other methods aborted and counted; POST /api/clients replayed locally only during long-error scenes',
  },
  gate: { apiRequests: [], nonGetAttempts: [], nonGetTotal: 0, backendNonGetForwarded: 0 },
  replay: {
    source: REPLAY.source,
    method: REPLAY.method,
    path: REPLAY.path,
    httpStatus: REPLAY.httpStatus,
    body: REPLAY.body,
    forwardedToBackend: false,
    interceptions: [],
  },
  sections: {},
}

function save() {
  fs.mkdirSync(path.dirname(OUT), { recursive: true })
  fs.writeFileSync(OUT, JSON.stringify(result, null, 2))
}

async function main() {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true })
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  })

  let nonGet = 0
  let replayEnabled = false

  // ---- network gate before first navigation ----
  await context.route('**/api/**', async (route) => {
    const req = route.request()
    const method = req.method().toUpperCase()
    const pathname = new URL(req.url()).pathname
    result.gate.apiRequests.push({ method, url: pathname })
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
      return route.continue()
    }
    nonGet += 1
    const entry = { method, url: pathname, postData: req.postData() || null, forwarded: false }
    if (replayEnabled && method === REPLAY.method && pathname === REPLAY.path) {
      entry.outcome = 'replayed-locally'
      result.gate.nonGetAttempts.push(entry)
      result.replay.interceptions.push({
        at: new Date().toISOString(),
        method,
        path: pathname,
        requestBody: req.postData() || null,
        outcome: 'replayed-locally',
        forwardedToBackend: false,
        responseCode: REPLAY.body.code,
      })
      return route.fulfill({
        status: REPLAY.httpStatus,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(REPLAY.body),
      })
    }
    entry.outcome = 'aborted'
    result.gate.nonGetAttempts.push(entry)
    return route.abort()
  })

  const page = await context.newPage()
  page.setDefaultTimeout(20000)
  await page.goto(`${BASE}/config/client`, { waitUntil: 'networkidle' })
  await page.waitForSelector('.el-table__row', { timeout: 30000 })
  result.meta.browserVersion = browser.version()
  result.meta.listRowCount = await page.locator('.el-table__row').count()
  result.meta.initialGateNonGet = nonGet
  const optionsSummary = await page.evaluate(async () => {
    const r = await fetch('/api/clients/data-source-options')
    const j = await r.json()
    return {
      code: j.code,
      total: Array.isArray(j.data) ? j.data.length : null,
      selectable: Array.isArray(j.data) ? j.data.filter((x) => x.selectable === true).length : null,
    }
  })
  result.meta.dataSourceOptions = optionsSummary
  save()

  // ------------------------------------------------------------ helpers
  const submitButton = () => page.locator('.cc-dialog-submit')
  const dialog = () => page.locator('.el-dialog.cc-dialog')

  async function wait(ms = 450) { await page.waitForTimeout(ms) }

  async function ensureSidebar(expanded) {
    const collapsed = await page.evaluate(() => document.querySelector('.sidebar')?.classList.contains('collapsed'))
    if (collapsed === !expanded) return
    await page.click('.collapse-btn')
    await wait(700)
  }

  async function closeDialogIfOpen() {
    if (await dialog().count()) {
      const visible = await dialog().isVisible().catch(() => false)
      if (visible) {
        await page.locator('.el-dialog__footer .el-button', { hasText: '取消' }).click()
        await page.waitForSelector('.el-dialog.cc-dialog', { state: 'hidden' })
        await wait(450)
      }
    }
  }

  async function openCreate() {
    await page.click('.cc-btn-add')
    await page.waitForSelector('.el-dialog.cc-dialog', { state: 'visible' })
    await page.waitForFunction(() => document.querySelectorAll('.cc-opt').length > 0, null, { timeout: 20000 })
    await wait(500)
  }

  async function clickOption(id) {
    const opt = page.locator('.cc-opt').filter({ hasText: id }).first()
    await opt.scrollIntoViewIfNeeded()
    await opt.click()
    await wait(350)
  }

  async function removeAllChips() {
    let n = await page.locator('.cc-chosen-list .cc-chip .el-tag__close, .cc-chosen-list .cc-chip .el-icon').count()
    while (n > 0) {
      await page.locator('.cc-chosen-list .cc-chip .el-tag__close, .cc-chosen-list .cc-chip .el-icon').first().click()
      await wait(250)
      const next = await page.locator('.cc-chosen-list .cc-chip').count()
      if (next >= n) break
      n = next
    }
  }

  async function fillId(value) {
    const input = page.locator('.cc-id-control .el-input__inner')
    await input.fill('')
    await input.focus()
    await page.keyboard.type(value, { delay: 12 })
  }

  async function fillDesc(value) {
    const ta = page.locator('.cc-desc-row textarea')
    await ta.fill('')
    await ta.focus()
    await page.keyboard.type(value, { delay: 8 })
  }

  async function measure(label) {
    await wait(450)
    const snap = await page.evaluate(() => {
      const q = (s) => document.querySelector(s)
      const rect = (el) => {
        if (!el) return null
        const r = el.getBoundingClientRect()
        return {
          x: +r.x.toFixed(2), y: +r.y.toFixed(2),
          top: +r.top.toFixed(2), left: +r.left.toFixed(2),
          right: +r.right.toFixed(2), bottom: +r.bottom.toFixed(2),
          width: +r.width.toFixed(2), height: +r.height.toFixed(2),
        }
      }
      const dlg = q('.el-dialog.cc-dialog')
      const submit = q('.cc-dialog-submit')
      const cancel = q('.el-dialog__footer .el-button:not(.cc-dialog-submit)')
      const form = q('.cc-form')
      const fbText = q('.cc-source-field .cc-field-feedback__text')
      const fbBox = q('.cc-source-field .cc-field-feedback')
      const sidebar = q('.sidebar')
      const content = q('.content-area')
      const docEl = document.documentElement

      let submitHit = null
      if (submit) {
        const r = submit.getBoundingClientRect()
        const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
        submitHit = {
          tag: hit ? hit.tagName : null,
          cls: hit && hit.className ? String(hit.className).slice(0, 120) : '',
          isSubmitOrChild: !!(hit && (hit === submit || submit.contains(hit))),
        }
      }

      const ancestors = []
      const lineBoxes = []
      const range = document.createRange()
      if (fbText && fbText.firstChild) {
        range.selectNodeContents(fbText)
        for (const r of Array.from(range.getClientRects())) {
          lineBoxes.push({
            top: +r.top.toFixed(2), left: +r.left.toFixed(2),
            width: +r.width.toFixed(2), height: +r.height.toFixed(2),
          })
        }
      }
      const formRect = form ? form.getBoundingClientRect() : null
      if (formRect) {
        for (const lb of lineBoxes) {
          lb.insideFormViewport = lb.top >= formRect.top - 0.5 && lb.top + lb.height <= formRect.bottom + 0.5
        }
      }
      let node = fbText
      while (node && node !== document.body) {
        const cs = getComputedStyle(node)
        ancestors.push({
          tag: node.tagName,
          cls: node.className ? String(node.className).slice(0, 120) : '',
          clientWidth: node.clientWidth, scrollWidth: node.scrollWidth,
          clientHeight: node.clientHeight, scrollHeight: node.scrollHeight,
          overflowX: cs.overflowX, overflowY: cs.overflowY,
        })
        node = node.parentElement
      }

      const style = (el, props) => {
        if (!el) return null
        const s = getComputedStyle(el)
        const out = {}
        for (const p of props) out[p] = s[p]
        return out
      }
      const dlgRect = dlg ? dlg.getBoundingClientRect() : null
      const contentRect = content ? content.getBoundingClientRect() : null
      return {
        viewport: {
          innerWidth: innerWidth,
          innerHeight: innerHeight,
          dpr: devicePixelRatio,
          visualViewportWidth: window.visualViewport ? +window.visualViewport.width.toFixed(2) : null,
          visualViewportHeight: window.visualViewport ? +window.visualViewport.height.toFixed(2) : null,
          screenWidth: screen.width,
          screenHeight: screen.height,
          screenAvailWidth: screen.availWidth,
          screenAvailHeight: screen.availHeight,
          zoomPercent: Math.round((window.visualViewport ? window.visualViewport.scale : 1) * 100),
        },
        sidebar: sidebar ? {
          collapsed: sidebar.classList.contains('collapsed'),
          rect: rect(sidebar),
        } : null,
        contentArea: rect(content),
        dialog: rect(dlg),
        dialogVisible: !!(dlg && dlg.getBoundingClientRect().width > 0),
        dialogStyle: style(dlg, ['width', 'height', 'maxWidth', 'maxHeight', 'marginTop', 'marginBottom', 'position', 'top', 'left']),
        dialogCentering: dlgRect ? {
          viewportCenterDelta: +(dlgRect.left + dlgRect.width / 2 - innerWidth / 2).toFixed(2),
          contentAreaCenterDelta: contentRect ? +(dlgRect.left + dlgRect.width / 2 - (contentRect.left + contentRect.width / 2)).toFixed(2) : null,
        } : null,
        form: form ? {
          rect: rect(form),
          clientHeight: form.clientHeight,
          scrollHeight: form.scrollHeight,
          scrollTop: form.scrollTop,
          overflowY: getComputedStyle(form).overflowY,
          maxHeight: getComputedStyle(form).maxHeight,
          scrollable: form.scrollHeight > form.clientHeight + 0.5,
        } : null,
        feedback: {
          exists: !!fbText,
          text: fbText ? fbText.textContent.trim() : null,
          boxExists: !!fbBox,
          toneClass: fbText ? fbText.className : null,
          style: style(fbText, ['fontSize', 'lineHeight', 'color', 'overflow', 'overflowWrap', 'height', 'whiteSpace']),
          pRect: rect(fbText),
          boxRect: rect(fbBox),
          lineCount: lineBoxes.length,
          lines: lineBoxes,
          allLinesInsideFormViewport: lineBoxes.length > 0 && lineBoxes.every((l) => l.insideFormViewport),
          ancestors,
        },
        submit: submit ? {
          rect: rect(submit),
          text: submit.innerText.trim(),
          disabled: submit.disabled,
          className: submit.className,
          hit: submitHit,
        } : null,
        cancel: rect(cancel),
        chosenCount: document.querySelectorAll('.cc-chosen-list .cc-chip').length,
        sourceSplitErrorClass: q('.cc-split') ? q('.cc-split').className : null,
        doc: {
          scrollWidth: docEl.scrollWidth,
          clientWidth: docEl.clientWidth,
          horizontalOverflow: docEl.scrollWidth > docEl.clientWidth,
        },
      }
    })
    return { label, ...snap }
  }

  const dlgTop = (s) => (s.dialog ? s.dialog.top : null)
  const dlgBottom = (s) => (s.dialog ? s.dialog.bottom : null)
  const dlgLeft = (s) => (s.dialog ? s.dialog.left : null)
  const dlgRight = (s) => (s.dialog ? s.dialog.right : null)
  const dlgHeight = (s) => (s.dialog ? s.dialog.height : null)
  const subX = (s) => (s.submit && s.submit.rect ? s.submit.rect.left : null)
  const subY = (s) => (s.submit && s.submit.rect ? s.submit.rect.top : null)

  function deltas(steps, refLabel) {
    const ref = steps.find((s) => s.label === refLabel)
    const series = {
      dialogTop: steps.map((s) => +(dlgTop(s) - dlgTop(ref)).toFixed(2)),
      dialogBottom: steps.map((s) => +(dlgBottom(s) - dlgBottom(ref)).toFixed(2)),
      dialogLeft: steps.map((s) => +(dlgLeft(s) - dlgLeft(ref)).toFixed(2)),
      dialogRight: steps.map((s) => +(dlgRight(s) - dlgRight(ref)).toFixed(2)),
      dialogHeight: steps.map((s) => +(dlgHeight(s) - dlgHeight(ref)).toFixed(2)),
      submitX: steps.map((s) => +(subX(s) - subX(ref)).toFixed(2)),
      submitY: steps.map((s) => +(subY(s) - subY(ref)).toFixed(2)),
    }
    const maxAbs = Object.fromEntries(
      Object.entries(series).map(([k, v]) => [k, +Math.max(...v.map((x) => Math.abs(x))).toFixed(2)]),
    )
    return { relativeTo: refLabel, labels: steps.map((s) => s.label), series, maxAbs }
  }

  function summarize(steps, refLabel) {
    const heights = steps.map((s) => s.dialog && s.dialog.height)
    const tops = steps.map((s) => s.dialog && s.dialog.top)
    const submits = steps.map((s) => s.submit && s.submit.rect && s.submit.rect.top)
    return {
      viewport: steps[0].viewport,
      sidebar: steps[0].sidebar,
      dialogHeightMin: Math.min(...heights),
      dialogHeightMax: Math.max(...heights),
      dialogTopMin: Math.min(...tops),
      dialogTopMax: Math.max(...tops),
      submitYMin: Math.min(...submits),
      submitYMax: Math.max(...submits),
      horizontalOverflowAny: steps.some((s) => s.doc.horizontalOverflow),
      submitHittableEveryStep: steps.every((s) => s.submit && s.submit.hit && s.submit.hit.isSubmitOrChild),
      dialogVisibleEveryStep: steps.every((s) => s.dialogVisible),
      feedbackTonePath: steps.map((s) => ({
        label: s.label,
        text: s.feedback.text,
        toneClass: s.feedback.toneClass,
        color: s.feedback.style && s.feedback.style.color,
        lineCount: s.feedback.lineCount,
      })),
      deltas: deltas(steps, refLabel),
    }
  }

  // ------------------------------------------------------------ 6-step sequence
  async function runSequence(width, height) {
    await page.setViewportSize({ width, height })
    await ensureSidebar(true)
    await closeDialogIfOpen()
    await openCreate()
    await fillId(`CCFG006-GEOM-${width}`)
    await fillDesc(`CCFG006 ${width} 稳定性几何样本`)
    await wait(400)

    const steps = []
    steps.push(await measure('initial-no-source'))
    steps.push(await measure('initial-no-source-stable'))

    await clickOption('CCFG-AC-R1-DS05')
    steps.push(await measure('selected-1'))

    await removeAllChips()
    steps.push(await measure('cancelled-all'))

    await submitButton().click()
    await wait(600)
    steps.push(await measure('after-submit-no-source-red'))

    await clickOption('CCFG-AC-R1-DS05')
    steps.push(await measure('corrected'))

    const summary = summarize(steps, 'initial-no-source-stable')
    await closeDialogIfOpen()
    return { viewport: { width, height }, sidebarExpanded: true, steps, summary }
  }

  {
    result.sections.sequence1920x1080 = await runSequence(1920, 1080)
    save()
    result.sections.sequence2560x1440 = await runSequence(2560, 1440)
    save()
  }

  // ------------------------------------------------------------ long-error scenes
  async function scrollFormToBottom() {
    return page.evaluate(() => {
      const form = document.querySelector('.cc-form')
      form.scrollTop = form.scrollHeight
      return {
        scrollTop: form.scrollTop,
        clientHeight: form.clientHeight,
        scrollHeight: form.scrollHeight,
        overflowY: getComputedStyle(form).overflowY,
      }
    })
  }

  async function runLongError(width, height, label) {
    await page.setViewportSize({ width, height })
    await ensureSidebar(true)
    await closeDialogIfOpen()
    await openCreate()
    await fillId(`CCFG006-LONG-${width}`)
    await fillDesc(`CCFG006 ${label} 长错误回放样本`)
    await clickOption('CCFG-AC-R1-DS05')
    await wait(400)
    const before = await measure('before-error')

    replayEnabled = true
    const interceptsBefore = result.replay.interceptions.length
    await submitButton().click()
    await page.waitForFunction(
      (msg) => {
        const el = document.querySelector('.cc-source-field .cc-field-feedback__text')
        return el && el.textContent.trim() === msg
      },
      REPLAY.message,
      { timeout: 15000 },
    )
    await wait(600)
    const after = await measure('after-error')
    const afterText = after.feedback.text

    let scrolled = null
    if (after.form && after.form.scrollable) {
      const scrollInfo = await scrollFormToBottom()
      await wait(400)
      const afterScroll = await measure('after-error-scrolled')
      scrolled = { scrollInfo, snapshot: afterScroll }
    }

    await clickOption('S2AC-E01')
    await wait(600)
    const corrected = await measure('corrected')
    replayEnabled = false
    const intercepts = result.replay.interceptions.slice(interceptsBefore)
    await closeDialogIfOpen()

    const steps = [before, after, ...(scrolled ? [scrolled.snapshot] : []), corrected]
    const heightDelta = (a, b) => {
      if (!a.dialog || !b.dialog) return null
      return {
        dialogTop: +(b.dialog.top - a.dialog.top).toFixed(2),
        dialogBottom: +(b.dialog.bottom - a.dialog.bottom).toFixed(2),
        dialogHeight: +(b.dialog.height - a.dialog.height).toFixed(2),
        dialogLeft: +(b.dialog.left - a.dialog.left).toFixed(2),
        submitX: +(b.submit.rect.left - a.submit.rect.left).toFixed(2),
        submitY: +(b.submit.rect.top - a.submit.rect.top).toFixed(2),
      }
    }

    return {
      scene: label,
      viewport: { width, height },
      sidebarExpanded: true,
      replay: {
        enabled: true,
        source: REPLAY.source,
        method: REPLAY.method,
        path: REPLAY.path,
        httpStatus: REPLAY.httpStatus,
        bodyCode: REPLAY.body.code,
        forwardedToBackend: false,
        interceptions: intercepts,
      },
      before,
      after,
      afterScroll: scrolled,
      corrected,
      textEqualsRecorded: afterText === REPLAY.message,
      shownText: afterText,
      lineCount: after.feedback.lineCount,
      wrapped: after.feedback.lineCount > 1,
      afterAllLinesInsideFormViewport: after.feedback.allLinesInsideFormViewport,
      afterScrollAllLinesInsideFormViewport: scrolled
        ? scrolled.snapshot.feedback.allLinesInsideFormViewport
        : null,
      feedbackOverflow: after.feedback.style && after.feedback.style.overflow,
      feedbackOverflowWrap: after.feedback.style && after.feedback.style.overflowWrap,
      geometryDelta: {
        afterVsBefore: heightDelta(before, after),
        correctedVsBefore: heightDelta(before, corrected),
      },
      steps,
    }
  }

  {
    result.sections.longError1920x1080 = await runLongError(1920, 1080, '1K')
    save()
    result.sections.longError2560x1440 = await runLongError(2560, 1440, '2K')
    save()
    result.sections.longError1024x720Supplement = await runLongError(1024, 720, 'supplement')
    save()
  }

  // ------------------------------------------------------------ counters
  result.gate.nonGetTotal = nonGet
  result.gate.backendNonGetForwarded = result.gate.nonGetAttempts.filter((e) => e.outcome !== 'replayed-locally' && e.forwarded).length
  result.meta.finishedAt = new Date().toISOString()
  result.meta.finalGateNonGet = nonGet
  save()

  await browser.close()
}

main().catch((e) => {
  result.meta.error = String(e && e.stack ? e.stack : e)
  save()
  console.error(e)
  process.exit(1)
})
