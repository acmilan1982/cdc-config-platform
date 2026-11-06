#!/usr/bin/env node
/*
 * CLIENT-CONFIG-DIALOG-ACCEPTANCE-005 — Probe A (read-only)
 *
 * Scope: /config/client only. Network gate installed before first navigation:
 *   GET/HEAD/OPTIONS forwarded; every other business request aborted and counted.
 * Covers:
 *   - AC-120 create/edit submit button normal / hover / keyboard focus / active styles,
 *     incomplete-form click behaviour, pre-disable check (busy path is Probe B / reused 004-R1).
 *   - AC-125/138 feedback sequence geometry and readability at 1440x900 and 1024x720,
 *     sidebar expanded and collapsed, document horizontal-overflow checks.
 *   - AC-134 read-only interaction matrix (create + edit): keyboard input, clipboard paste,
 *     auto-generate order, cancel-all, submit failure, correction, close/reopen, edit lock,
 *     candidate eligibility / occupied hint / comma-ID rule observed against the live options API.
 *
 * No product code, DOM or CSS is modified. Clipboard use is a real Ctrl+V paste via
 * granted clipboard permissions; if unavailable the probe records the fallback method.
 */
const { chromium } = require('/root/.hermes/hermes-agent/node_modules/playwright-core')
const fs = require('fs')
const path = require('path')

const BASE = 'http://127.0.0.1:5173'
const API = 'http://127.0.0.1:8080'
const OUT = path.resolve(__dirname, '..', 'results', 'probeA-readonly.json')
const CHROME = '/root/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome'

const result = {
  meta: {
    probe: 'probeA-readonly',
    startedAt: new Date().toISOString(),
    base: BASE,
    browser: CHROME,
    gate: 'context.route **/api/** — GET/HEAD/OPTIONS forwarded; all other methods aborted and counted',
    pageScope: '/config/client only',
  },
  gate: { nonGetAttempts: [], apiRequests: [] },
  sections: {},
}

function save() {
  fs.mkdirSync(path.dirname(OUT), { recursive: true })
  fs.writeFileSync(OUT, JSON.stringify(result, null, 2))
}

async function main() {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  })
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE })

  // ---- network gate before first navigation ----
  let nonGet = 0
  await context.route('**/api/**', async (route) => {
    const req = route.request()
    const method = req.method().toUpperCase()
    result.gate.apiRequests.push({ method, url: new URL(req.url()).pathname })
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
      return route.continue()
    }
    nonGet += 1
    result.gate.nonGetAttempts.push({ method, url: new URL(req.url()).pathname, postData: req.postData() })
    return route.abort()
  })

  const page = await context.newPage()
  page.setDefaultTimeout(20000)
  await page.goto(`${BASE}/config/client`, { waitUntil: 'networkidle' })
  await page.waitForSelector('.el-table__row', { timeout: 30000 })
  result.meta.listRowCount = await page.locator('.el-table__row').count()

  // ------------------------------------------------------------ helpers
  const style = (loc) => loc.evaluate((el) => {
    const s = getComputedStyle(el)
    return {
      backgroundColor: s.backgroundColor,
      borderTopColor: s.borderTopColor,
      borderRightColor: s.borderRightColor,
      borderBottomColor: s.borderBottomColor,
      borderLeftColor: s.borderLeftColor,
      borderTopWidth: s.borderTopWidth,
      borderRightWidth: s.borderRightWidth,
      borderBottomWidth: s.borderBottomWidth,
      borderLeftWidth: s.borderLeftWidth,
      color: s.color,
      borderRadius: s.borderRadius,
      fontWeight: s.fontWeight,
      cursor: s.cursor,
      pointerEvents: s.pointerEvents,
    }
  })
  const submitButton = () => page.locator('.cc-dialog-submit')
  const dialogBox = () => page.locator('.el-dialog.cc-dialog')
  const feedback = () => page.locator('.cc-source-field .cc-field-feedback__text')
  const idError = () => page.locator('.cc-form-item').nth(0).locator('.ced-field-error')
  const descError = () => page.locator('.cc-form-item').nth(1).locator('.ced-field-error')

  async function buttonSnapshot(label) {
    const btn = submitButton()
    const cls = await btn.getAttribute('class')
    return {
      label,
      state: 'queried',
      text: (await btn.innerText()).trim(),
      className: cls,
      disabledAttr: await btn.isDisabled(),
      style: await style(btn),
    }
  }

  async function waitStable(ms = 450) { await page.waitForTimeout(ms) }

  async function measureViewportState(label) {
    await waitStable()
    // collect geometry + readability + overflow facts
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
      const dialog = q('.el-dialog.cc-dialog')
      const submit = q('.cc-dialog-submit')
      const cancel = q('.el-dialog__footer .el-button:not(.cc-dialog-submit)')
      const form = q('.cc-form')
      const fbText = q('.cc-source-field .cc-field-feedback__text')
      const fbBox = q('.cc-source-field .cc-field-feedback')
      const sidebar = q('.sidebar')
      const p = fbText
      const ancestorOverflow = []
      let node = p
      while (node && node !== document.body) {
        const cs = getComputedStyle(node)
        ancestorOverflow.push({
          tag: node.tagName,
          cls: (node.className && String(node.className).slice(0, 120)) || '',
          clientWidth: node.clientWidth,
          scrollWidth: node.scrollWidth,
          clientHeight: node.clientHeight,
          scrollHeight: node.scrollHeight,
          overflowX: cs.overflowX,
          overflowY: cs.overflowY,
          maxHeight: cs.maxHeight,
          height: cs.height,
        })
        node = node.parentElement
      }
      const css = (el) => {
        if (!el) return null
        const s = getComputedStyle(el)
        return {
          fontSize: s.fontSize, lineHeight: s.lineHeight, color: s.color,
          overflowWrap: s.overflowWrap, overflow: s.overflow, height: s.height,
          minHeight: s.minHeight, whiteSpace: s.whiteSpace,
        }
      }
      const range = document.createRange()
      let lineBoxes = null
      if (p && p.firstChild) {
        range.selectNodeContents(p)
        lineBoxes = Array.from(range.getClientRects()).map((r) => ({
          top: +r.top.toFixed(2), left: +r.left.toFixed(2),
          width: +r.width.toFixed(2), height: +r.height.toFixed(2),
        }))
      }
      const docEl = document.documentElement
      return {
        viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
        sidebar: sidebar ? { collapsed: sidebar.classList.contains('collapsed'), rect: rect(sidebar) } : null,
        dialog: rect(dialog),
        dialogStyle: css(dialog),
        dialogComputedPosition: dialog ? getComputedStyle(dialog).position : null,
        dialogCentering: dialog ? {
          expectedLeft: +((innerWidth - dialog.getBoundingClientRect().width) / 2).toFixed(2),
          actualLeft: +dialog.getBoundingClientRect().left.toFixed(2),
          delta: +(dialog.getBoundingClientRect().left - (innerWidth - dialog.getBoundingClientRect().width) / 2).toFixed(2),
        } : null,
        footer: { submit: rect(submit), cancel: rect(cancel) },
        form: form ? {
          rect: rect(form),
          clientHeight: form.clientHeight,
          scrollHeight: form.scrollHeight,
          scrollTop: form.scrollTop,
          overflowY: getComputedStyle(form).overflowY,
          maxHeight: getComputedStyle(form).maxHeight,
        } : null,
        doc: {
          scrollWidth: docEl.scrollWidth,
          clientWidth: docEl.clientWidth,
          horizontalOverflow: docEl.scrollWidth > docEl.clientWidth,
          bodyScrollWidth: document.body.scrollWidth,
          bodyClientWidth: document.body.clientWidth,
        },
        feedback: {
          exists: !!fbText,
          text: fbText ? fbText.textContent.trim() : null,
          toneClass: fbText ? fbText.className : null,
          style: css(fbText),
          wrapText: p ? p.textContent : null,
          lineBoxes,
          box: fbBox ? { rect: rect(fbBox), style: css(fbBox) } : null,
          ancestorOverflow,
        },
        idError: (() => {
          const el = q('.cc-id-control')?.parentElement?.querySelector('.ced-field-error')
          return el ? { text: el.textContent.trim(), rect: rect(el) } : null
        })(),
        descError: (() => {
          const el = q('.cc-desc-row')?.parentElement?.querySelector('.ced-field-error')
          return el ? { text: el.textContent.trim(), rect: rect(el) } : null
        })(),
        chosenCount: document.querySelectorAll('.cc-chosen-list .cc-chip').length,
        submit: submit ? {
          text: submit.innerText.trim(),
          disabled: submit.disabled,
          className: submit.className,
          rect: rect(submit),
        } : null,
        sourceSplitErrorClass: q('.cc-split') ? q('.cc-split').className : null,
      }
    })
    return { label, ...snap, gateNonGetTotal: nonGet }
  }

  async function ensureSidebar(expanded) {
    const collapsed = await page.evaluate(() => document.querySelector('.sidebar')?.classList.contains('collapsed'))
    if (collapsed === !expanded) return
    await page.click('.collapse-btn')
    await waitStable(600)
  }

  async function closeDialogIfOpen() {
    if (await page.locator('.el-dialog.cc-dialog').count()) {
      const visible = await page.locator('.el-dialog.cc-dialog').isVisible().catch(() => false)
      if (visible) {
        await page.locator('.el-dialog__footer .el-button', { hasText: '取消' }).click()
        await page.waitForSelector('.el-dialog.cc-dialog', { state: 'hidden' })
        await waitStable(400)
      }
    }
  }

  async function openCreate() {
    await page.click('.cc-btn-add')
    await page.waitForSelector('.el-dialog.cc-dialog', { state: 'visible' })
    await page.waitForFunction(() => document.querySelectorAll('.cc-opt').length > 0, null, { timeout: 20000 })
    await waitStable()
  }

  async function optionByText(id) {
    return page.locator('.cc-opt').filter({ hasText: id }).first()
  }

  async function clickOption(id) {
    const opt = await optionByText(id)
    await opt.scrollIntoViewIfNeeded()
    await opt.click()
    await waitStable(300)
  }

  async function removeAllChips() {
    let n = await page.locator('.cc-chosen-list .cc-chip .el-tag__close, .cc-chosen-list .cc-chip .el-icon').count()
    while (n > 0) {
      await page.locator('.cc-chosen-list .cc-chip .el-tag__close, .cc-chosen-list .cc-chip .el-icon').first().click()
      await waitStable(200)
      const next = await page.locator('.cc-chosen-list .cc-chip').count()
      if (next >= n) break
      n = next
    }
  }

  async function fillId(value) {
    const input = page.locator('.cc-id-control .el-input__inner')
    await input.fill('')
    await page.locator('.cc-id-control .el-input__inner').focus()
    await page.keyboard.type(value, { delay: 15 })
  }

  async function fillDesc(value) {
    const ta = page.locator('.cc-desc-row textarea')
    await ta.fill('')
    await ta.focus()
    await page.keyboard.type(value, { delay: 10 })
  }

  async function keyboardFocusSnapshot() {
    // Focus the footer cancel button, then Tab once so the submit button receives
    // genuine keyboard (focus-visible) focus. Avoids tabbing through 200+ option buttons.
    await page.locator('.el-dialog__footer .el-button').first().focus()
    let tabs = 0
    let focused = false
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab')
      tabs += 1
      focused = await page.evaluate(() => document.activeElement?.classList?.contains('cc-dialog-submit') === true)
      if (focused) break
    }
    const focusVisible = await page.evaluate(() => !!document.activeElement?.matches?.(':focus-visible'))
    const snap = focused ? await buttonSnapshot('keyboard-focus') : { label: 'keyboard-focus', focused: false, tabs }
    return { ...snap, focused, tabs, focusVisible }
  }

  // ------------------------------------------------------------ AC-120 create
  {
    await ensureSidebar(true)
    await openCreate()
    const sec = { referenceApproved: { bg: '#09090b', border: '#09090b', text: '#ffffff', radius: '6px', weight: '500', hover: '#27272a', active: '#18181b' } }
    sec.normal = await buttonSnapshot('create-normal')
    sec.preClickDisabled = await submitButton().isDisabled()
    sec.preClickPointerEvents = (await style(submitButton())).pointerEvents

    // hover
    const box = await submitButton().boundingBox()
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await waitStable(250)
    sec.hover = await buttonSnapshot('create-hover')

    // keyboard focus
    sec.keyboardFocus = await keyboardFocusSnapshot()

    // active (mouse down -> sample -> mouse up); form is incomplete so no business write
    await page.locator('.cc-dialog-submit').scrollIntoViewIfNeeded()
    const box2 = await submitButton().boundingBox()
    await page.mouse.move(box2.x + box2.width / 2, box2.y + box2.height / 2)
    await page.mouse.down()
    await waitStable(120)
    sec.active = await buttonSnapshot('create-active')
    await page.mouse.up()
    await waitStable(500)
    sec.afterIncompleteClick = {
      idError: await idError().count() ? (await idError().first().innerText()).trim() : null,
      descError: await descError().count() ? (await descError().first().innerText()).trim() : null,
      feedbackText: await feedback().count() ? (await feedback().first().innerText()).trim() : null,
      feedbackClass: await feedback().count() ? await feedback().first().getAttribute('class') : null,
      submitDisabled: await submitButton().isDisabled(),
      nonGetAttemptsAtEnd: nonGet,
    }
    sec.nonGetAttemptsAtEnd = nonGet
    result.sections.ac120Create = sec
    save()
    await closeDialogIfOpen()
  }

  // ------------------------------------------------------------ AC-120 edit
  {
    const row = page.locator('.el-table__row').filter({ hasText: 'CCFG004-NEW1' }).first()
    await row.scrollIntoViewIfNeeded()
    await row.locator('.cc-desc').first().dblclick()
    await page.waitForSelector('.el-dialog.cc-dialog', { state: 'visible' })
    await page.waitForFunction(() => document.querySelectorAll('.cc-opt').length > 0, null, { timeout: 20000 })
    await waitStable()
    const sec = {
      title: await page.locator('.el-dialog.cc-dialog .el-dialog__title').innerText(),
      idLocked: await page.locator('.cc-id-control .el-input__inner[data-locked="true"]').count() > 0,
      lockHint: await page.locator('.cc-lock-hint').count() ? (await page.locator('.cc-lock-hint').innerText()).trim() : null,
      toggleText: await page.locator('.cc-id-toggle').innerText(),
    }
    sec.normal = await buttonSnapshot('edit-normal')
    sec.preClickDisabled = await submitButton().isDisabled()

    const box = await submitButton().boundingBox()
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await waitStable(250)
    sec.hover = await buttonSnapshot('edit-hover')

    sec.keyboardFocus = await keyboardFocusSnapshot()

    // make the form incomplete (clear description) so the pressed click cannot save
    await page.locator('.cc-desc-row textarea').fill('')
    await waitStable(200)
    const box2 = await submitButton().boundingBox()
    await page.mouse.move(box2.x + box2.width / 2, box2.y + box2.height / 2)
    await page.mouse.down()
    await waitStable(120)
    sec.active = await buttonSnapshot('edit-active')
    await page.mouse.up()
    await waitStable(500)
    sec.afterIncompleteClick = {
      descError: await descError().count() ? (await descError().first().innerText()).trim() : null,
      submitDisabled: await submitButton().isDisabled(),
      nonGetAttemptsAtEnd: nonGet,
    }
    result.sections.ac120Edit = sec
    save()
    await closeDialogIfOpen()
  }

  // ------------------------------------------------------------ AC-125 / AC-138 sequence
  async function runFeedbackSequence(viewport, sidebarExpanded) {
    await page.setViewportSize(viewport)
    await ensureSidebar(sidebarExpanded)
    await closeDialogIfOpen()
    await openCreate()
    await fillId('CCFG005-GEOM')
    await fillDesc('CCFG005 几何序列样本')
    await waitStable(300)
    const seq = []
    seq.push(await measureViewportState('initial-no-source'))
    seq.push(await measureViewportState('initial-no-source-stable'))

    await clickOption('CCFG-AC-R1-DS06')
    seq.push(await measureViewportState('selected-1'))

    await removeAllChips()
    seq.push(await measureViewportState('cancelled-all-before-submit'))

    await submitButton().click()
    await waitStable(500)
    seq.push(await measureViewportState('after-submit-no-source-red'))

    await clickOption('CCFG-AC-R1-DS06')
    seq.push(await measureViewportState('corrected-source-selected'))

    const summary = {
      viewport,
      sidebarExpanded,
      steps: seq,
      dialogHeightValues: seq.map((s) => s.dialog && s.dialog.height),
      dialogTopValues: seq.map((s) => s.dialog && s.dialog.top),
      submitYValues: seq.map((s) => s.footer && s.footer.submit && s.footer.submit.y),
      maxDialogHeight: Math.max(...seq.map((s) => (s.dialog ? s.dialog.height : 0))),
      minDialogHeight: Math.min(...seq.map((s) => (s.dialog ? s.dialog.height : Infinity))),
      horizontalOverflowAny: seq.some((s) => s.doc.horizontalOverflow),
      fixedDialogHeightCss: seq[0].dialogStyle && seq[0].dialogStyle.height,
      formControlledScroll: seq[0].form && seq[0].form.overflowY,
      feedbackTonePath: seq.map((s) => ({
        label: s.label, text: s.feedback.text, toneClass: s.feedback.toneClass,
        color: s.feedback.style && s.feedback.style.color,
      })),
    }
    await closeDialogIfOpen()
    return summary
  }

  {
    const wide = await runFeedbackSequence({ width: 1440, height: 900 }, true)
    const wideCollapsed = await runFeedbackSequence({ width: 1440, height: 900 }, false)
    const narrow = await runFeedbackSequence({ width: 1024, height: 720 }, true)
    result.sections.ac125Ac138 = { wide, wideCollapsed, narrow }
    save()
  }

  // ------------------------------------------------------------ AC-125 narrow-viewport feedback reachability
  {
    await page.setViewportSize({ width: 1024, height: 720 })
    await ensureSidebar(true)
    await closeDialogIfOpen()
    await openCreate()
    await fillId('CCFG005-GEOM2')
    await fillDesc('CCFG005 窄视口反馈可达性样本')
    await submitButton().click()
    await waitStable(500)
    const before = await measureViewportState('narrow-red-before-scroll')
    const scroll = await page.evaluate(() => {
      const form = document.querySelector('.cc-form')
      form.scrollTop = form.scrollHeight
      return { scrollTop: form.scrollTop, clientHeight: form.clientHeight, scrollHeight: form.scrollHeight }
    })
    await waitStable(300)
    const after = await measureViewportState('narrow-red-after-form-scroll')
    const visibility = await page.evaluate(() => {
      const form = document.querySelector('.cc-form')
      const p = document.querySelector('.cc-source-field .cc-field-feedback__text')
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
        feedbackRect: { top: +pr.top.toFixed(2), bottom: +pr.bottom.toFixed(2) },
        fullyInsideFormViewport: pr.top >= fr.top - 0.5 && pr.bottom <= fr.bottom + 0.5,
        lines,
        computed: { overflow: getComputedStyle(p).overflow, height: getComputedStyle(p).height, lineHeight: getComputedStyle(p).lineHeight },
      }
    })
    result.sections.ac125NarrowScroll = { before, scroll, after, visibility }
    await closeDialogIfOpen()
    save()
  }

  // ------------------------------------------------------------ AC-134 candidate checks (live API vs page)
  {
    await page.setViewportSize({ width: 1440, height: 900 })
    await ensureSidebar(true)
    await closeDialogIfOpen()
    await openCreate()
    const api = await fetch(`${API}/api/clients/data-source-options`).then((r) => r.json())
    const list = api.data
    const wanted = [
      'CCFG-AC-R1-COM,ID',
      'CCFG-AC-R1-DS05', 'CCFG-AC-R1-DS06',
      'CCFG004-DS-A', 'CCFG004-DS-B',
    ]
    const apiSamples = list.filter((x) => wanted.includes(x.dataSourceId))
    const domSamples = await page.evaluate((ids) => {
      const out = []
      for (const id of ids) {
        const btn = Array.from(document.querySelectorAll('.cc-opt')).find((b) => b.textContent.includes(id))
        if (!btn) { out.push({ id, present: false }); continue }
        out.push({
          id,
          present: true,
          disabled: btn.disabled,
          className: btn.className,
          title: btn.getAttribute('title'),
          reason: (btn.querySelector('.cc-opt-reason')?.textContent || '').trim() || null,
          mainText: (btn.querySelector('.cc-opt-main')?.textContent || '').trim(),
          subText: (btn.querySelector('.cc-opt-sub')?.textContent || '').trim(),
        })
      }
      return out
    }, wanted)

    // option item count and disabled aggregates without dumping real business names
    const domAgg = await page.evaluate(() => {
      const all = Array.from(document.querySelectorAll('.cc-opt'))
      return {
        count: all.length,
        disabled: all.filter((b) => b.disabled).length,
        commaReasons: all.filter((b) => (b.querySelector('.cc-opt-reason')?.textContent || '').includes('英文逗号')).length,
        occupiedReasons: all.filter((b) => (b.querySelector('.cc-opt-reason')?.textContent || '').includes('已分配给')).length,
      }
    })
    result.sections.ac134Candidates = {
      apiTotal: list.length,
      domAgg,
      apiSamples,
      domSamples,
    }
    save()
  }

  // ------------------------------------------------------------ AC-134 create interaction matrix
  async function createMatrix() {
    await closeDialogIfOpen()
    await openCreate()
    const m = {}

    // keyboard input (real key events)
    await fillId('CCFG005-KB1')
    m.keyboard = {
      action: 'focus .cc-id-control input + keyboard.type(delay=15)',
      idValue: await page.locator('.cc-id-control .el-input__inner').inputValue(),
      descValueAfterId: await page.locator('.cc-desc-row textarea').inputValue(),
    }

    // real clipboard paste
    try {
      await page.evaluate(async () => { await navigator.clipboard.writeText('PASTE-005-描述样本') })
      const ta = page.locator('.cc-desc-row textarea')
      await ta.fill('')
      await ta.focus()
      await page.keyboard.press('Control+V')
      await waitStable(300)
      const val = await ta.inputValue()
      m.paste = {
        method: 'navigator.clipboard.writeText + Control+V keyboard press',
        clipboardPermissionGranted: true,
        descValue: val,
        valueMatches: val === 'PASTE-005-描述样本',
      }
    } catch (e) {
      m.paste = { method: 'clipboard unavailable', error: String(e) }
    }

    // auto-generate order: DS06 then DS05
    await removeAllChips()
    await clickOption('CCFG-AC-R1-DS06')
    await clickOption('CCFG-AC-R1-DS05')
    const chosenBefore = await page.evaluate(() => Array.from(document.querySelectorAll('.cc-chosen-list .cc-chip')).map((e) => e.textContent.trim()))
    await page.locator('.cc-autogen').click()
    await waitStable(300)
    m.autoGenerate = {
      chosenOrder: chosenBefore,
      action: 'click .cc-autogen',
      descValue: await page.locator('.cc-desc-row textarea').inputValue(),
    }

    // reverse order
    await removeAllChips()
    await clickOption('CCFG-AC-R1-DS05')
    await clickOption('CCFG-AC-R1-DS06')
    const chosenBefore2 = await page.evaluate(() => Array.from(document.querySelectorAll('.cc-chosen-list .cc-chip')).map((e) => e.textContent.trim()))
    await page.locator('.cc-autogen').click()
    await waitStable(300)
    m.autoGenerateReverse = {
      chosenOrder: chosenBefore2,
      descValue: await page.locator('.cc-desc-row textarea').inputValue(),
    }

    // cancel all -> neutral hint
    await removeAllChips()
    m.cancelAll = await measureViewportState('create-cancel-all')

    // submit failure (no source, empty desc, valid id)
    await fillId('CCFG005-KB1')
    await fillDesc('')
    await submitButton().click()
    await waitStable(400)
    m.submitFailure = await measureViewportState('create-submit-failure')

    // correction
    await fillDesc('CCFG005 修正后的描述')
    await clickOption('CCFG-AC-R1-DS06')
    m.corrected = await measureViewportState('create-corrected')
    m.nonGetAttemptsAtEnd = nonGet
    await closeDialogIfOpen()

    // close -> reopen -> reset
    await openCreate()
    m.reopen = {
      idValue: await page.locator('.cc-id-control .el-input__inner').inputValue(),
      descValue: await page.locator('.cc-desc-row textarea').inputValue(),
      chosenCount: await page.locator('.cc-chosen-list .cc-chip').count(),
      feedbackText: await feedback().count() ? (await feedback().first().innerText()).trim() : null,
      idErrorCount: await idError().count(),
      descErrorCount: await descError().count(),
    }
    await closeDialogIfOpen()
    return m
  }
  result.sections.ac134Create = await createMatrix()
  save()

  // ------------------------------------------------------------ AC-134 edit interaction matrix
  async function editMatrix() {
    const row = page.locator('.el-table__row').filter({ hasText: 'CCFG004-NEW1' }).first()
    await row.scrollIntoViewIfNeeded()
    await row.locator('.cc-desc').first().dblclick()
    await page.waitForSelector('.el-dialog.cc-dialog', { state: 'visible' })
    await page.waitForFunction(() => document.querySelectorAll('.cc-opt').length > 0, null, { timeout: 20000 })
    await waitStable()
    const m = {
      title: await page.locator('.el-dialog.cc-dialog .el-dialog__title').innerText(),
      initial: {
        idValue: await page.locator('.cc-id-control .el-input__inner').inputValue(),
        idLocked: await page.locator('.cc-id-control .el-input__inner[data-locked="true"]').count() > 0,
        lockHint: await page.locator('.cc-lock-hint').count() ? (await page.locator('.cc-lock-hint').innerText()).trim() : null,
        toggleText: await page.locator('.cc-id-toggle').innerText(),
        chosen: await page.evaluate(() => Array.from(document.querySelectorAll('.cc-chosen-list .cc-chip')).map((e) => e.textContent.trim())),
      },
    }

    // unlock / edit / cancel unlock
    await page.locator('.cc-id-toggle').click()
    await waitStable(250)
    m.unlocked = {
      inputEditable: await page.locator('.cc-id-control .el-input__inner').isEditable().catch(() => false),
      toggleText: await page.locator('.cc-id-toggle').innerText(),
      value: await page.locator('.cc-id-control .el-input__inner').inputValue(),
    }
    await page.locator('.cc-id-toggle').click()
    await waitStable(250)
    m.relocked = {
      idLocked: await page.locator('.cc-id-control .el-input__inner[data-locked="true"]').count() > 0,
      toggleText: await page.locator('.cc-id-toggle').innerText(),
      value: await page.locator('.cc-id-control .el-input__inner').inputValue(),
    }

    // keyboard input in description
    await fillDesc('CCFG005-NEW-EDIT-KB')
    m.keyboard = {
      action: 'clear textarea + keyboard.type(delay=10)',
      descValue: await page.locator('.cc-desc-row textarea').inputValue(),
    }

    // clipboard paste
    try {
      await page.evaluate(async () => { await navigator.clipboard.writeText('EDIT-PASTE-005') })
      const ta = page.locator('.cc-desc-row textarea')
      await ta.fill('')
      await ta.focus()
      await page.keyboard.press('Control+V')
      await waitStable(300)
      const val = await ta.inputValue()
      m.paste = { method: 'navigator.clipboard.writeText + Control+V', descValue: val, valueMatches: val === 'EDIT-PASTE-005' }
    } catch (e) {
      m.paste = { method: 'clipboard unavailable', error: String(e) }
    }

    // auto-generate with own source + another selectable source
    await removeAllChips()
    await clickOption('CCFG-AC-R1-DS05')
    await clickOption('CCFG004-DS-B')
    const chosen = await page.evaluate(() => Array.from(document.querySelectorAll('.cc-chosen-list .cc-chip')).map((e) => e.textContent.trim()))
    await page.locator('.cc-autogen').click()
    await waitStable(300)
    m.autoGenerate = { chosenOrder: chosen, descValue: await page.locator('.cc-desc-row textarea').inputValue() }

    // cancel all -> submit failure (source + desc)
    await removeAllChips()
    await page.locator('.cc-desc-row textarea').fill('')
    await submitButton().click()
    await waitStable(400)
    m.cancelAllSubmitFailure = await measureViewportState('edit-cancelall-failure')

    // correction
    await fillDesc('CCFG005 edit corrected')
    await clickOption('CCFG-AC-R1-DS05')
    m.corrected = await measureViewportState('edit-corrected')
    m.nonGetAttemptsAtEnd = nonGet
    await closeDialogIfOpen()

    // reopen
    const row2 = page.locator('.el-table__row').filter({ hasText: 'CCFG004-NEW1' }).first()
    await row2.scrollIntoViewIfNeeded()
    await row2.locator('.cc-desc').first().dblclick()
    await page.waitForSelector('.el-dialog.cc-dialog', { state: 'visible' })
    await page.waitForFunction(() => document.querySelectorAll('.cc-opt').length > 0, null, { timeout: 20000 })
    await waitStable()
    m.reopen = {
      idValue: await page.locator('.cc-id-control .el-input__inner').inputValue(),
      idLocked: await page.locator('.cc-id-control .el-input__inner[data-locked="true"]').count() > 0,
      descValue: await page.locator('.cc-desc-row textarea').inputValue(),
      chosenCount: await page.locator('.cc-chosen-list .cc-chip').count(),
    }
    await closeDialogIfOpen()
    return m
  }
  result.sections.ac134Edit = await editMatrix()

  // ------------------------------------------------------------ static no-hardcoded-offset evidence
  result.sections.layoutStatic = await page.evaluate(() => {
    const rules = []
    for (const sheet of Array.from(document.styleSheets)) {
      let list
      try { list = sheet.cssRules } catch { continue }
      for (const rule of Array.from(list || [])) {
        const t = rule.cssText || ''
        if (/cc-dialog|ced-dialog/.test(t) && /(left|margin-left|translateX|top|height)\s*:/.test(t)) rules.push(t.slice(0, 400))
      }
    }
    return rules.slice(0, 40)
  })

  result.meta.finishedAt = new Date().toISOString()
  result.meta.gateNonGetTotal = nonGet
  save()
  await browser.close()
}

main().catch(async (e) => {
  result.error = { message: String(e && e.message || e), stack: String(e && e.stack || '') }
  result.meta.finishedAt = new Date().toISOString()
  try { save() } catch {}
  console.error(e)
  process.exit(1)
})
