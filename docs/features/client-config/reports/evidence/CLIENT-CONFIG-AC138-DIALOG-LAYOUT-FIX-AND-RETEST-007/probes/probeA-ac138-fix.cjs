#!/usr/bin/env node
/*
 * CLIENT-CONFIG-AC138-DIALOG-LAYOUT-FIX-AND-RETEST-007 — Probe A
 *
 * Scope: /config/client only. A fresh browser context is created per scenario and the
 * network gate is installed before the first navigation of each context:
 *   GET/HEAD/OPTIONS forwarded; every other business request aborted and counted.
 *   Exactly one controlled exception while replayEnabled: the submit request of the
 *   long-error scene (POST /api/clients for create, PUT /api/clients/<id> for edit) is
 *   fulfilled in the browser with the 40941 response recorded by the 005 batch. The
 *   request is NEVER forwarded to the backend.
 *
 * Scenarios:
 *   - create and edit, each: 6-step stability sequence + long 40941 error replay.
 *   - 1920x1080 (primary) and 2560x1440 (secondary), sidebar expanded, DPR 1, 100%.
 *   - 1024x720 regression: long-error readability after controlled form scroll,
 *     submit reachability, document horizontal overflow.
 *   - MODE=baseline reproduces the pre-fix failure at 1920x1080 (create + edit) and
 *     must be run against the unmodified working tree.
 *   - MODE=fixed runs the full retest against the page-local fix.
 *
 * No product code, DOM or CSS is modified by this probe. No database, fixture,
 * ZooKeeper/Kafka access or business write.
 */
const { chromium } = require('/root/.hermes/hermes-agent/node_modules/playwright-core')
const fs = require('fs')
const path = require('path')

const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173'
const MODE = process.env.MODE === 'baseline' ? 'baseline' : 'fixed'
const CHROME = '/root/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome'
const OUT = path.resolve(
  __dirname,
  '..',
  'results',
  MODE === 'baseline' ? 'baseline-repro-1k.json' : 'ac138-fix-retest.json',
)

const REPLAY_SOURCE_PATH = path.resolve(
  __dirname,
  '..',
  '..',
  'CLIENT-CONFIG-DIALOG-ACCEPTANCE-005',
  'results',
  'probeB-write.json',
)
const RECORDED = JSON.parse(fs.readFileSync(REPLAY_SOURCE_PATH, 'utf-8'))
const RECORDED_BODY = RECORDED.gate.responses[0].body
const RECORDED_MESSAGE = RECORDED_BODY.message

const EDIT_CLIENT_ID = 'probe-001'
const SELECTABLE_SOURCE = 'CCFG-AC-R1-DS05'
const CORRECTION_SOURCE = 'S2AC-E01'

const result = {
  meta: {
    probe: 'probeA-ac138-fix',
    task: 'CLIENT-CONFIG-AC138-DIALOG-LAYOUT-FIX-AND-RETEST-007',
    mode: MODE,
    startedAt: new Date().toISOString(),
    base: BASE,
    browser: CHROME,
    pageScope: '/config/client only',
    editClientId: EDIT_CLIENT_ID,
    gate:
      'context.route **/api/** before first navigation; GET/HEAD/OPTIONS forwarded; other methods aborted and counted; the long-error submit is fulfilled locally with the 005-recorded 40941 body; backend non-GET forwarded = 0',
    serviceWorkers: 'blocked',
  },
  gate: { apiRequests: [], nonGetAttempts: [], nonGetTotal: 0, backendNonGetForwarded: 0 },
  replay: {
    source:
      'docs/features/client-config/reports/evidence/CLIENT-CONFIG-DIALOG-ACCEPTANCE-005/results/probeB-write.json → gate.responses[0].body',
    body: RECORDED_BODY,
    forwardedToBackend: false,
    interceptions: [],
  },
  sections: {},
}

function save() {
  fs.mkdirSync(path.dirname(OUT), { recursive: true })
  fs.writeFileSync(OUT, JSON.stringify(result, null, 2))
}

function recordNonGet(entry) {
  result.gate.nonGetAttempts.push(entry)
}

async function main() {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true })
  result.meta.browserVersion = browser.version()

  // ---------------------------------------------------------------- per-scenario
  async function runScenario({ width, height, mode, focus }) {
    const context = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: 1,
      serviceWorkers: 'block',
    })

    const sectionKey = `${mode}${width}x${height}${focus === 'long' ? '-' + focus : ''}`
    const scenario = {
      scene: `${mode} @ ${width}x${height}${focus === 'long' ? ' (long-error focus)' : ''}`,
      mode,
      focus,
      viewport: { width, height },
      sidebarExpanded: true,
      steps: [],
      summary: null,
      longError: null,
      network: { nonGetAttempts: [] },
    }

    let nonGetLocal = 0
    let replayEnabled = false
    let stepLabel = 'setup'
    let scenarioTag = sectionKey
    const expectedReplay =
      mode === 'edit'
        ? { method: 'PUT', path: `/api/clients/${EDIT_CLIENT_ID}` }
        : { method: 'POST', path: '/api/clients' }

    await context.route('**/api/**', async (route) => {
      const req = route.request()
      const method = req.method().toUpperCase()
      const pathname = new URL(req.url()).pathname
      result.gate.apiRequests.push({ scenario: scenarioTag, step: stepLabel, method, url: pathname })
      if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
        return route.continue()
      }
      nonGetLocal += 1
      const entry = {
        scenario: scenarioTag,
        step: stepLabel,
        method,
        url: pathname,
        postData: req.postData() || null,
        forwarded: false,
      }
      if (replayEnabled && method === expectedReplay.method && pathname === expectedReplay.path) {
        entry.outcome = 'replayed-locally'
        recordNonGet(entry)
        scenario.network.nonGetAttempts.push(entry)
        result.replay.interceptions.push({
          scenario: scenarioTag,
          at: new Date().toISOString(),
          method,
          path: pathname,
          requestBody: req.postData() || null,
          outcome: 'replayed-locally',
          forwardedToBackend: false,
          responseCode: RECORDED_BODY.code,
        })
        return route.fulfill({
          status: 200,
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(RECORDED_BODY),
        })
      }
      entry.outcome = 'aborted'
      recordNonGet(entry)
      scenario.network.nonGetAttempts.push(entry)
      return route.abort()
    })

    const page = await context.newPage()
    page.setDefaultTimeout(25000)

    const submitButton = () => page.locator('.cc-dialog-submit')
    const dialog = () => page.locator('.el-dialog.cc-dialog')
    const wait = (ms = 450) => page.waitForTimeout(ms)

    async function ensureSidebarExpanded() {
      const collapsed = await page.evaluate(() =>
        document.querySelector('.sidebar')?.classList.contains('collapsed'),
      )
      if (collapsed) {
        await page.click('.collapse-btn')
        await wait(700)
      }
    }

    async function closeDialogIfOpen() {
      if ((await dialog().count()) > 0) {
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
      await page.waitForFunction(() => document.querySelectorAll('.cc-opt').length > 0, null, {
        timeout: 25000,
      })
      await wait(500)
    }

    async function openEdit() {
      await closeDialogIfOpen()
      const row = page.locator('.el-table__row', { hasText: EDIT_CLIENT_ID }).first()
      await row.scrollIntoViewIfNeeded()
      await row.dblclick()
      await page.waitForSelector('.el-dialog.cc-dialog', { state: 'visible' })
      await page.waitForFunction(() => document.querySelectorAll('.cc-opt').length > 0, null, {
        timeout: 25000,
      })
      await wait(500)
    }

    async function clickOption(id) {
      const opt = page.locator('.cc-opt').filter({ hasText: id }).first()
      await opt.scrollIntoViewIfNeeded()
      await opt.click()
      await wait(350)
    }

    async function removeAllChipsSilent() {
      let n = await page
        .locator('.cc-chosen-list .cc-chip .el-tag__close, .cc-chosen-list .cc-chip .el-icon')
        .count()
      while (n > 0) {
        await page
          .locator('.cc-chosen-list .cc-chip .el-tag__close, .cc-chosen-list .cc-chip .el-icon')
          .first()
          .click()
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
      await wait(400)
      const snap = await page.evaluate(() => {
        const q = (s) => document.querySelector(s)
        const rect = (el) => {
          if (!el) return null
          const r = el.getBoundingClientRect()
          return {
            x: +r.x.toFixed(2),
            y: +r.y.toFixed(2),
            top: +r.top.toFixed(2),
            left: +r.left.toFixed(2),
            right: +r.right.toFixed(2),
            bottom: +r.bottom.toFixed(2),
            width: +r.width.toFixed(2),
            height: +r.height.toFixed(2),
          }
        }
        const style = (el, props) => {
          if (!el) return null
          const s = getComputedStyle(el)
          const out = {}
          for (const p of props) out[p] = s[p]
          return out
        }
        const dlg = q('.el-dialog.cc-dialog')
        const submit = q('.cc-dialog-submit')
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

        const lineBoxes = []
        if (fbText && fbText.firstChild) {
          const range = document.createRange()
          range.selectNodeContents(fbText)
          for (const r of Array.from(range.getClientRects())) {
            lineBoxes.push({
              top: +r.top.toFixed(2),
              left: +r.left.toFixed(2),
              width: +r.width.toFixed(2),
              height: +r.height.toFixed(2),
            })
          }
        }
        const formRect = form ? form.getBoundingClientRect() : null
        if (formRect) {
          for (const lb of lineBoxes) {
            lb.insideFormViewport =
              lb.top >= formRect.top - 0.5 && lb.top + lb.height <= formRect.bottom + 0.5
          }
        }

        const dlgRect = dlg ? dlg.getBoundingClientRect() : null
        const contentRect = content ? content.getBoundingClientRect() : null
        return {
          viewport: {
            innerWidth,
            innerHeight,
            dpr: devicePixelRatio,
            visualViewportWidth: window.visualViewport ? +window.visualViewport.width.toFixed(2) : null,
            visualViewportHeight: window.visualViewport ? +window.visualViewport.height.toFixed(2) : null,
            zoomPercent: Math.round((window.visualViewport ? window.visualViewport.scale : 1) * 100),
            screenWidth: screen.width,
            screenHeight: screen.height,
          },
          sidebar: sidebar
            ? { collapsed: sidebar.classList.contains('collapsed'), rect: rect(sidebar) }
            : null,
          contentArea: rect(content),
          dialog: rect(dlg),
          dialogVisible: !!(dlg && dlg.getBoundingClientRect().width > 0),
          dialogTitle: q('.el-dialog__title') ? q('.el-dialog__title').textContent.trim() : null,
          dialogStyle: style(dlg, [
            'width',
            'height',
            'maxWidth',
            'maxHeight',
            'marginTop',
            'marginBottom',
            'position',
            'top',
            'left',
          ]),
          dialogCentering: dlgRect
            ? {
                viewportCenterDelta: +(dlgRect.left + dlgRect.width / 2 - innerWidth / 2).toFixed(2),
                contentAreaCenterDelta: contentRect
                  ? +(dlgRect.left + dlgRect.width / 2 - (contentRect.left + contentRect.width / 2)).toFixed(2)
                  : null,
              }
            : null,
          form: form
            ? {
                rect: rect(form),
                clientHeight: form.clientHeight,
                scrollHeight: form.scrollHeight,
                scrollTop: form.scrollTop,
                overflowY: getComputedStyle(form).overflowY,
                maxHeight: getComputedStyle(form).maxHeight,
                scrollable: form.scrollHeight > form.clientHeight + 0.5,
              }
            : null,
          feedback: {
            exists: !!fbText,
            text: fbText ? fbText.textContent.trim() : null,
            toneClass: fbText ? fbText.className : null,
            style: style(fbText, [
              'fontSize',
              'lineHeight',
              'color',
              'overflow',
              'overflowWrap',
              'height',
              'whiteSpace',
            ]),
            boxExists: !!fbBox,
            boxRect: rect(fbBox),
            boxStyle: style(fbBox, ['minHeight', 'height']),
            pRect: rect(fbText),
            lineCount: lineBoxes.length,
            lines: lineBoxes,
            allLinesInsideFormViewport:
              lineBoxes.length > 0 && lineBoxes.every((l) => l.insideFormViewport),
          },
          submit: submit
            ? {
                rect: rect(submit),
                text: submit.innerText.trim(),
                disabled: submit.disabled,
                className: submit.className,
                hit: submitHit,
              }
            : null,
          chosenCount: document.querySelectorAll('.cc-chosen-list .cc-chip').length,
          sourceSplitErrorClass: q('.cc-split') ? q('.cc-split').className : null,
          doc: {
            scrollWidth: docEl.scrollWidth,
            clientWidth: docEl.clientWidth,
            horizontalOverflow: docEl.scrollWidth > docEl.clientWidth,
          },
        }
      })
      return { label: label, ...snap }
    }

    async function startMonitor() {
      await page.evaluate(() => {
        window.__ac138Samples = []
        const t0 = performance.now()
        const tick = () => {
          const d = document.querySelector('.el-dialog.cc-dialog')
          const s = document.querySelector('.cc-dialog-submit')
          if (d && s) {
            const dr = d.getBoundingClientRect()
            const sr = s.getBoundingClientRect()
            const fb = document.querySelector('.cc-source-field .cc-field-feedback__text')
            window.__ac138Samples.push({
              t: +(performance.now() - t0).toFixed(1),
              top: +dr.top.toFixed(2),
              bottom: +dr.bottom.toFixed(2),
              height: +dr.height.toFixed(2),
              submitY: +sr.top.toFixed(2),
              feedback: fb ? fb.textContent.trim().slice(0, 24) : null,
            })
          }
          if (performance.now() - t0 < 1400) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      })
    }

    async function readMonitor() {
      return page.evaluate(() => window.__ac138Samples || [])
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
      const report = {
        viewport: steps[0].viewport,
        sidebar: steps[0].sidebar,
        dialogHeightMin: Math.min(...steps.map((s) => s.dialog.height)),
        dialogHeightMax: Math.max(...steps.map((s) => s.dialog.height)),
        dialogTopMin: Math.min(...steps.map((s) => s.dialog.top)),
        dialogTopMax: Math.max(...steps.map((s) => s.dialog.top)),
        submitYMin: Math.min(...steps.map((s) => s.submit.rect.top)),
        submitYMax: Math.max(...steps.map((s) => s.submit.rect.top)),
        horizontalOverflowAny: steps.some((s) => s.doc.horizontalOverflow),
        submitHittableEveryStep: steps.every((s) => s.submit.hit && s.submit.hit.isSubmitOrChild),
        dialogVisibleEveryStep: steps.every((s) => s.dialogVisible),
        feedbackTonePath: steps.map((s) => ({
          label: s.label,
          text: s.feedback.text,
          toneClass: s.feedback.toneClass,
          lineCount: s.feedback.lineCount,
          boxHeight: s.feedback.boxRect ? s.feedback.boxRect.height : null,
        })),
        deltas: deltas(steps, refLabel),
      }
      return report
    }

    function transitionSummary(samples, before) {
      if (!samples.length) return null
      const refs = {
        dialogTop: before.dialog.top,
        dialogBottom: before.dialog.bottom,
        dialogHeight: before.dialog.height,
        submitY: before.submit.rect.top,
      }
      const sampleKey = {
        dialogTop: 'top',
        dialogBottom: 'bottom',
        dialogHeight: 'height',
        submitY: 'submitY',
      }
      const deviation = (key) => {
        const vals = samples.map((s) => s[sampleKey[key]])
        return {
          min: +Math.min(...vals).toFixed(2),
          max: +Math.max(...vals).toFixed(2),
          maxAbsVsBefore: +Math.max(...vals.map((v) => Math.abs(v - refs[key]))).toFixed(2),
        }
      }
      return {
        sampleCount: samples.length,
        durationMs: samples[samples.length - 1].t,
        dialogTop: deviation('dialogTop'),
        dialogBottom: deviation('dialogBottom'),
        dialogHeight: deviation('dialogHeight'),
        submitY: deviation('submitY'),
        frames: samples,
      }
    }

    try {
      stepLabel = 'navigate'
      await page.goto(`${BASE}/config/client`, { waitUntil: 'networkidle' })
      await page.waitForSelector('.el-table__row', { timeout: 30000 })
      result.meta.listRowCount = await page.locator('.el-table__row').count()
      await ensureSidebarExpanded()
      await wait(300)

      // ---------------------------------------------------------- 6-step sequence
      if (focus !== 'long') {
        stepLabel = 'sequence-open'
        if (mode === 'create') await openCreate()
        else await openEdit()
        if (mode === 'create') {
          await fillId(`CCFG007-${width}`)
          await fillDesc(`CCFG007 ${width} 稳定性样本`)
        }
        await wait(400)

        const steps = []
        steps.push(await measure('opened'))
        if (mode === 'edit') {
          await removeAllChipsSilent()
          await wait(400)
        }
        steps.push(await measure('initial-no-source-stable'))

        stepLabel = 'sequence-select-1'
        await clickOption(SELECTABLE_SOURCE)
        steps.push(await measure('selected-1'))

        stepLabel = 'sequence-cancel-all'
        await removeAllChipsSilent()
        steps.push(await measure('cancelled-all'))

        stepLabel = 'sequence-submit-red'
        const beforeRed = await measure('before-submit')
        await startMonitor()
        await submitButton().click()
        await page.waitForFunction(
          () => {
            const el = document.querySelector('.cc-source-field .cc-field-feedback__text')
            return el && el.textContent.includes('至少选择 1 个数据源')
          },
          null,
          { timeout: 15000 },
        )
        await wait(800)
        const redSamples = await readMonitor()
        steps.push(await measure('after-submit-no-source-red'))

        stepLabel = 'sequence-correct'
        await clickOption(SELECTABLE_SOURCE)
        steps.push(await measure('corrected'))

        scenario.steps = steps
        scenario.summary = summarize(steps, 'initial-no-source-stable')
        scenario.summary.redTransition = transitionSummary(redSamples, beforeRed)
        stepLabel = 'sequence-close'
        await closeDialogIfOpen()
      }

      // ---------------------------------------------------------- long error
      if (focus !== 'sequence') {
        const longError = {
          scene: mode,
          replay: {
            source: result.replay.source,
            expected: expectedReplay,
            forwardedToBackend: false,
          },
        }
        stepLabel = 'long-open'
        if (mode === 'create') {
          await closeDialogIfOpen()
          await openCreate()
          await fillId(`CCFG007-LONG-${width}`)
          await fillDesc(`CCFG007 ${width} 长错误回放样本`)
          await clickOption(SELECTABLE_SOURCE)
        } else {
          await openEdit()
        }
        await wait(450)
        const before = await measure('before-error')

        replayEnabled = true
        stepLabel = 'long-submit'
        const interceptsBefore = result.replay.interceptions.length
        await startMonitor()
        await submitButton().click()
        await page.waitForFunction(
          (msg) => {
            const el = document.querySelector('.cc-source-field .cc-field-feedback__text')
            return el && el.textContent.trim() === msg
          },
          RECORDED_MESSAGE,
          { timeout: 15000 },
        )
        await wait(800)
        const samples = await readMonitor()
        const after = await measure('after-error')

        let scrolled = null
        if (after.form && after.form.scrollable) {
          stepLabel = 'long-scroll'
          const scrollInfo = await page.evaluate(() => {
            const form = document.querySelector('.cc-form')
            form.scrollTop = form.scrollHeight
            return {
              scrollTop: form.scrollTop,
              clientHeight: form.clientHeight,
              scrollHeight: form.scrollHeight,
              overflowY: getComputedStyle(form).overflowY,
            }
          })
          await wait(400)
          scrolled = { scrollInfo, snapshot: await measure('after-error-scrolled') }
        }

        stepLabel = 'long-correct'
        await clickOption(CORRECTION_SOURCE)
        await wait(600)
        const corrected = await measure('corrected')
        replayEnabled = false
        stepLabel = 'long-close'
        await closeDialogIfOpen()

        const heightDelta = (a, b) => {
          if (!a.dialog || !b.dialog) return null
          return {
            dialogTop: +(b.dialog.top - a.dialog.top).toFixed(2),
            dialogBottom: +(b.dialog.bottom - a.dialog.bottom).toFixed(2),
            dialogHeight: +(b.dialog.height - a.dialog.height).toFixed(2),
            dialogLeft: +(b.dialog.left - a.dialog.left).toFixed(2),
            dialogRight: +(b.dialog.right - a.dialog.right).toFixed(2),
            submitX: +(b.submit.rect.left - a.submit.rect.left).toFixed(2),
            submitY: +(b.submit.rect.top - a.submit.rect.top).toFixed(2),
          }
        }

        longError.before = before
        longError.after = after
        longError.afterScroll = scrolled
        longError.corrected = corrected
        longError.textEqualsRecorded = after.feedback.text === RECORDED_MESSAGE
        longError.lineCount = after.feedback.lineCount
        longError.wrapped = after.feedback.lineCount > 1
        longError.afterAllLinesInsideFormViewport = after.feedback.allLinesInsideFormViewport
        longError.afterScrollAllLinesInsideFormViewport = scrolled
          ? scrolled.snapshot.feedback.allLinesInsideFormViewport
          : null
        longError.submitHittableAfter = after.submit.hit && after.submit.hit.isSubmitOrChild
        longError.submitHittableAfterScroll = scrolled
          ? scrolled.snapshot.submit.hit && scrolled.snapshot.submit.hit.isSubmitOrChild
          : null
        longError.horizontalOverflowAfter = after.doc.horizontalOverflow
        longError.feedbackStyle = after.feedback.style
        longError.feedbackBoxStyle = after.feedback.boxStyle
        longError.reservedBoxHeight = after.feedback.boxRect ? after.feedback.boxRect.height : null
        longError.reservedBoxMinHeight = after.feedback.boxStyle ? after.feedback.boxStyle.minHeight : null
        longError.geometryDelta = {
          afterVsBefore: heightDelta(before, after),
          correctedVsBefore: heightDelta(before, corrected),
        }
        longError.transition = transitionSummary(samples, before)
        longError.replay.interceptions = result.replay.interceptions.slice(interceptsBefore)
        longError.requestBody = longError.replay.interceptions[0]
          ? longError.replay.interceptions[0].requestBody
          : null

        scenario.longError = longError
      }

      stepLabel = 'done'
      scenario.gate = {
        nonGetInScenario: nonGetLocal,
        backendNonGetForwarded: scenario.network.nonGetAttempts.filter((e) => e.forwarded).length,
      }
      result.sections[sectionKey] = scenario
      save()
    } catch (e) {
      scenario.error = String(e && e.stack ? e.stack : e)
      result.sections[sectionKey] = scenario
      save()
      throw e
    } finally {
      await context.close().catch(() => {})
    }
  }

  // ---------------------------------------------------------------- schedule
  if (MODE === 'baseline') {
    await runScenario({ width: 1920, height: 1080, mode: 'create', focus: 'full' })
    result.meta.finishedAt = new Date().toISOString()
    save()
    await runScenario({ width: 1920, height: 1080, mode: 'edit', focus: 'full' })
  } else {
    await runScenario({ width: 1920, height: 1080, mode: 'create', focus: 'full' })
    await runScenario({ width: 1920, height: 1080, mode: 'edit', focus: 'full' })
    await runScenario({ width: 2560, height: 1440, mode: 'create', focus: 'full' })
    await runScenario({ width: 2560, height: 1440, mode: 'edit', focus: 'full' })
    await runScenario({ width: 1024, height: 720, mode: 'create', focus: 'long' })
    await runScenario({ width: 1024, height: 720, mode: 'edit', focus: 'long' })
  }

  result.gate.nonGetTotal = result.gate.nonGetAttempts.length
  result.gate.backendNonGetForwarded = result.gate.nonGetAttempts.filter((e) => e.forwarded).length
  result.meta.finishedAt = new Date().toISOString()
  save()
  await browser.close()
}

main().catch((e) => {
  result.meta.error = String(e && e.stack ? e.stack : e)
  result.meta.finishedAt = new Date().toISOString()
  save()
  console.error(e)
  process.exit(1)
})
