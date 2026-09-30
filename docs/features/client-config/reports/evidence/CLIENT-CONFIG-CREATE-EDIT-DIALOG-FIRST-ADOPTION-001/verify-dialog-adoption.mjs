// Read-only real-browser verification: /config/client create/edit business MAIN dialog adopts the
// approved create-edit-dialog-visual-template public CSS preset (CREATE-EDIT-DIALOG-CLIENT-CONFIG-
// FIRST-ADOPTION-001). Read-only reference /config/data-source stays un-adopted.
//
// Data source: an independent READ-ONLY stub. GET /api/clients and
// GET /api/clients/data-source-options are fulfilled in-browser with synthetic desensitized
// payloads; every non-GET /api/** request is held at the browser routing layer and then aborted,
// so it NEVER reaches the Vite proxy or the real backend. No real backend, database or ZooKeeper
// is contacted, and no write request is ever allowed through.
//
// Run: PLAYWRIGHT_MODULE=<playwright-dir> node verify-dialog-adoption.mjs
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE ?? 'playwright')

const BASE = 'http://127.0.0.1:5173'
const OUT = path.dirname(new URL(import.meta.url).pathname)

/** 脱敏合成只读数据：1 行启用探针 + 2 个可选数据源候选。 */
const SYNTHETIC_ITEMS = [
  {
    clientId: 'probe-syn-1',
    clientDesc: '合成探针一',
    status: 'ENABLED',
    fgActive: '1',
    dataSourceCount: 1,
    rawDataSourceIds: 'SRC-SYN-A',
    possibleCommaDataSourceIds: [],
    rowAnomalies: [],
    dataSources: [
      {
        dataSourceId: 'SRC-SYN-A',
        org: '合成机构甲',
        dataSourceName: '合成源甲',
        anomalies: [],
        conflictClientIds: [],
      },
    ],
  },
]

const SYNTHETIC_OPTIONS = [
  {
    dataSourceId: 'SRC-SYN-A',
    org: '合成机构甲',
    dataSourceName: '合成源甲',
    selectable: true,
    notSelectableReason: null,
    occupiedByClientIds: [],
  },
  {
    dataSourceId: 'SRC-SYN-B',
    org: '合成机构乙',
    dataSourceName: '合成源乙',
    selectable: true,
    notSelectableReason: null,
    occupiedByClientIds: [],
  },
]

const envelope = (data) =>
  JSON.stringify({ code: 200, message: 'ok', data, timestamp: '2026-09-30T00:00:00' })

const readCalls = []
const writeAttempts = []
let releaseHeldWrite = null

const browser = await chromium.launch({ args: ['--no-sandbox'] })
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 })

// 只拦站点根 `/api/**` 的后端接口；绝不命中 `/src/api/*.ts` 这类源模块请求。
const isBackendApi = (url) => new URL(url).pathname.startsWith('/api/')
await ctx.route(isBackendApi, async (route) => {
  const req = route.request()
  const method = req.method().toUpperCase()
  const url = req.url()
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    readCalls.push({ method, url })
    if (/\/api\/clients\/data-source-options(\?|$)/.test(url)) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: envelope(SYNTHETIC_OPTIONS),
      })
    }
    if (/\/api\/clients(\?|$)/.test(url)) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: envelope({ items: SYNTHETIC_ITEMS }),
      })
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json; charset=utf-8',
      body: envelope([]),
    })
  }
  // 非 GET：在网络层挂起（不转发、不落地），等脚本读完加载态后再 abort；
  // 因此真实后端/Vite 代理从未收到该请求。
  writeAttempts.push({ method, url })
  await new Promise((res) => {
    releaseHeldWrite = res
  })
  return route.abort('blockedbyclient')
})

const page = await ctx.newPage()
const results = { meta: {}, checks: [], values: {} }

await page.goto(`${BASE}/config/client`, { waitUntil: 'networkidle' })
await page.waitForSelector('.cc-btn-add', { timeout: 15000 })

const DIALOG = '.el-dialog.cc-dialog.ced-dialog'
const LABEL = `${DIALOG} .cc-form-label.ced-form-label.ced-required-mark`
const ROW = `${DIALOG} .cc-form-item.ced-label-row`
const FEEDBACK = `${DIALOG} .cc-field-feedback.ced-field-feedback`
const SUBMIT = `${DIALOG} button.cc-dialog-submit.ced-submit`

/** 读公共预设类的挂载计数（全文档，含 Teleport 到 body 的真实弹窗）。 */
const countCed = () =>
  page.evaluate(() => ({
    cedDialog: document.querySelectorAll('.ced-dialog').length,
    cedLabelRow: document.querySelectorAll('.ced-label-row').length,
    cedFormLabel: document.querySelectorAll('.ced-form-label').length,
    cedRequiredMark: document.querySelectorAll('.ced-required-mark').length,
    cedSubmit: document.querySelectorAll('.ced-submit').length,
    cedFieldFeedback: document.querySelectorAll('.ced-field-feedback').length,
    cedFieldError: document.querySelectorAll('.ced-field-error').length,
    cedFieldErrorState: document.querySelectorAll('.ced-field--error').length,
  }))

/** 读真实弹窗 DOM 的类串与公共预设规则来源（Vite dev 注入的 style 带 data-vite-dev-id）。 */
const readPresetProvenance = () =>
  page.evaluate(() => {
    const root = document.querySelector('.el-dialog.cc-dialog.ced-dialog')
    const sheets = []
    for (const sheet of document.styleSheets) {
      let selectors = []
      try {
        selectors = [...sheet.cssRules].map((r) => r.selectorText).filter(Boolean)
      } catch {
        /* cross-origin */
      }
      if (selectors.some((s) => s.includes('.ced-dialog'))) {
        sheets.push({
          viteDevId: sheet.ownerNode?.getAttribute?.('data-vite-dev-id') ?? null,
          href: sheet.href,
          cedDialogRules: selectors.filter((s) => s.includes('.ced-dialog')),
        })
      }
    }
    return {
      rootClassName: root ? root.className : null,
      rootStyleAttr: root ? root.getAttribute('style') : null,
      rootInlineWidthProp: root ? root.style.getPropertyValue('--el-dialog-width') : null,
      tokens: root
        ? {
            labelColumnWidth: getComputedStyle(root).getPropertyValue('--ced-label-column-width').trim(),
            labelGap: getComputedStyle(root).getPropertyValue('--ced-label-gap').trim(),
            safetyInset: getComputedStyle(root).getPropertyValue('--ced-dialog-safety-inset').trim(),
            submitBgLoading: getComputedStyle(root).getPropertyValue('--ced-submit-bg-loading').trim(),
          }
        : null,
      sheets,
    }
  })

const readStaticStyles = () =>
  page.evaluate(
    ({ DIALOG, LABEL, ROW, FEEDBACK }) => {
      const pick = (el, keys) => {
        if (!el) return { _present: false }
        const s = getComputedStyle(el)
        const out = { _present: true }
        for (const k of keys) out[k] = s[k]
        return out
      }
      const label = document.querySelector(LABEL)
      const labelPseudo = label ? getComputedStyle(label, '::before') : null
      const row = document.querySelector(ROW)
      const feedback = document.querySelector(FEEDBACK)
      const dialog = document.querySelector(DIALOG)
      const dialogStyle = dialog ? getComputedStyle(dialog) : null
      return {
        dialog: {
          _present: !!dialog,
          maxWidth: dialogStyle?.maxWidth ?? null,
          width: dialog ? +dialog.getBoundingClientRect().width.toFixed(2) : null,
          scrollWidth: dialog?.scrollWidth ?? null,
          clientWidth: dialog?.clientWidth ?? null,
        },
        label: pick(label, [
          'fontSize',
          'fontWeight',
          'color',
          'textAlign',
          'flexBasis',
          'flexGrow',
          'flexShrink',
          'paddingTop',
          'width',
        ]),
        labelStar: labelPseudo
          ? {
              content: labelPseudo.content,
              color: labelPseudo.color,
              marginRight: labelPseudo.marginRight,
            }
          : null,
        row: pick(row, ['display', 'alignItems', 'gap', 'columnGap']),
        feedback: pick(feedback, ['minHeight', 'marginTop']),
        submitText: document.querySelector(`${DIALOG} button.cc-dialog-submit.ced-submit`)?.textContent?.trim() ?? null,
        nonTargetButtons: [...document.querySelectorAll(`${DIALOG} .el-dialog__footer button`)]
          .map((b) => ({ text: b.textContent.trim(), hasCedSubmit: b.classList.contains('ced-submit') })),
        // “修改探针 ID”开关位于字段区（非页脚），单独核对不得挂公共/私有主按钮类。
        idToggle: (() => {
          const b = document.querySelector(`${DIALOG} .cc-id-toggle`)
          return b
            ? {
                text: b.textContent.trim(),
                hasCedSubmit: b.classList.contains('ced-submit'),
                hasCcSubmit: b.classList.contains('cc-dialog-submit'),
              }
            : null
        })(),
      }
    },
    { DIALOG, LABEL, ROW, FEEDBACK },
  )

const readButton = () =>
  page.evaluate((SUBMIT) => {
    const b = document.querySelector(SUBMIT)
    if (!b) return { _present: false }
    const s = getComputedStyle(b)
    const before = getComputedStyle(b, '::before')
    return {
      _present: true,
      className: b.className,
      hasDisabledAttr: b.hasAttribute('disabled'),
      isDisabledClass: b.classList.contains('is-disabled'),
      isLoadingClass: b.classList.contains('is-loading'),
      backgroundColor: s.backgroundColor,
      borderTopColor: s.borderTopColor,
      color: s.color,
      borderRadius: s.borderRadius,
      fontWeight: s.fontWeight,
      cursor: s.cursor,
      maskBeforeBg: before.backgroundColor,
      maskBeforeContent: before.content,
    }
  }, SUBMIT)

const check = (name, ok, detail) => {
  results.checks.push({ name, ok: !!ok, detail })
  return ok
}

// ---------------------------------------------------------------- 新增弹窗：静态视觉
await page.click('.cc-btn-add')
await page.waitForSelector(DIALOG, { timeout: 10000 })
await page.waitForTimeout(200)

const provenance = await readPresetProvenance()
const counts = await countCed()
const staticStyles = await readStaticStyles()
const submitNormal = await readButton()

results.meta = {
  chrome: await page.evaluate(() => navigator.userAgent),
  page: `${BASE}/config/client`,
  viewport: await page.viewportSize(),
  syntheticStub: {
    clients: '/api/clients → 合成 1 行',
    dataSourceOptions: '/api/clients/data-source-options → 合成 2 项',
    otherGets: '空集合 200',
  },
}
results.values.createDialog = { provenance, counts, staticStyles, submitNormal }

check('新增弹窗根类保留 cc-dialog 并追加 ced-dialog', provenance.rootClassName === 'el-dialog cc-dialog ced-dialog', provenance.rootClassName)
check('公共预设规则来源为公共 CSS 文件（Vite dev id）', provenance.sheets.some((s) => (s.viteDevId ?? '').endsWith('/src/styles/dialog/create-edit-dialog-visual.css')), provenance.sheets)
check('四个 Feature 令牌由本页在真实弹窗根上提供', provenance.tokens?.labelColumnWidth === '84px' && provenance.tokens?.labelGap === '12px' && provenance.tokens?.safetyInset === '48px' && provenance.tokens?.submitBgLoading === '#3f3f46', provenance.tokens)
check('三个标签行/标签/必填星号/反馈占位挂公共类', counts.cedLabelRow === 3 && counts.cedFormLabel === 3 && counts.cedRequiredMark === 3 && counts.cedFieldFeedback === 3, counts)
check('仅主提交按钮挂 ced-submit（1 个）', counts.cedSubmit === 1, counts)
check('弹窗有效宽度仍为 900px（width="900px" 经 EP 的 --el-dialog-width 生效）', staticStyles.dialog.width === 900 && provenance.rootInlineWidthProp === '900px' && staticStyles.dialog.maxWidth === '1232px', { dialog: staticStyles.dialog, rootInlineWidthProp: provenance.rootInlineWidthProp, rootStyleAttr: provenance.rootStyleAttr })
check('标签字体 14px/500/#3f3f46 且右对齐、列宽 84px', staticStyles.label.fontSize === '14px' && staticStyles.label.fontWeight === '500' && staticStyles.label.color === 'rgb(63, 63, 70)' && staticStyles.label.textAlign === 'right' && staticStyles.label.flexBasis === '84px', staticStyles.label)
check('标签上内边距 6px（本页结构差异保留）', staticStyles.label.paddingTop === '6px', staticStyles.label.paddingTop)
check('必填星号为唯一 content:*，颜色 #f56c6c', staticStyles.labelStar?.content === '"*"' && staticStyles.labelStar?.color === 'rgb(245, 108, 108)', staticStyles.labelStar)
check('标签行 flex + 12px gap（公共 .ced-label-row）', staticStyles.row.display === 'flex' && staticStyles.row.gap === '12px', staticStyles.row)
check('反馈占位 min-height 20px / margin-top 2px（公共 .ced-field-feedback）', staticStyles.feedback.minHeight === '20px' && staticStyles.feedback.marginTop === '2px', staticStyles.feedback)
check('主提交按钮常态为黑色实心（公共 .ced-submit）', submitNormal.backgroundColor === 'rgb(9, 9, 11)' && submitNormal.borderTopColor === 'rgb(9, 9, 11)' && submitNormal.color === 'rgb(255, 255, 255)' && submitNormal.borderRadius === '6px' && submitNormal.fontWeight === '500', submitNormal)
check('取消按钮不挂 ced-submit', staticStyles.nonTargetButtons.some((b) => b.text === '取消' && !b.hasCedSubmit), staticStyles.nonTargetButtons)

// 悬停/焦点/按下/装填态
await page.hover(SUBMIT)
await page.waitForTimeout(200)
const submitHover = await readButton()
await page.evaluate((SUBMIT) => document.querySelector(SUBMIT)?.focus(), SUBMIT)
await page.waitForTimeout(200)
const submitFocus = await readButton()
const box = await page.locator(SUBMIT).boundingBox()
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
await page.mouse.down()
await page.waitForTimeout(200)
const submitActive = await readButton()
await page.mouse.up()
await page.waitForTimeout(200)
results.values.createDialog.states = { submitHover, submitFocus, submitActive }
check('hover 换色 #27272a', submitHover.backgroundColor === 'rgb(39, 39, 42)', submitHover.backgroundColor)
check('focus 保持 #27272a', submitFocus.backgroundColor === 'rgb(39, 39, 42)', submitFocus.backgroundColor)
check('active 换色 #18181b', submitActive.backgroundColor === 'rgb(24, 24, 27)', submitActive.backgroundColor)

// ---------------------------------------------------------------- 字段错误态 + 长文案换行（窄视口）
await page.setViewportSize({ width: 420, height: 900 })
await page.waitForTimeout(200)
const narrowStatic = await readStaticStyles()
await page.fill(`${DIALOG} .cc-id-control input`, '9bad!')
await page.click(SUBMIT)
await page.waitForTimeout(300)
const errorState = await page.evaluate(
  ({ DIALOG }) => {
    const containers = [...document.querySelectorAll(`${DIALOG} .ced-field--error`)]
    const texts = [...document.querySelectorAll(`${DIALOG} .ced-field-error`)]
    const wrap = document.querySelector(`${DIALOG} .cc-id-control`)?.closest('.ced-field--error')
    const wrapper = wrap?.querySelector('.el-input__wrapper')
    const longText = texts.find((t) => t.textContent.includes('探针 ID 格式不正确'))
    const s = longText ? getComputedStyle(longText) : null
    const lineHeight = s ? parseFloat(s.lineHeight) : NaN
    return {
      errorContainerCount: containers.length,
      errorTextCount: texts.length,
      inputWrapperBoxShadow: wrapper ? getComputedStyle(wrapper).boxShadow : null,
      longError: longText
        ? {
            fontSize: s.fontSize,
            color: s.color,
            lineHeight: s.lineHeight,
            overflowWrap: s.overflowWrap,
            height: +longText.getBoundingClientRect().height.toFixed(2),
            width: +longText.getBoundingClientRect().width.toFixed(2),
            lineCount: Number.isFinite(lineHeight) ? +(longText.getBoundingClientRect().height / lineHeight).toFixed(2) : null,
          }
        : null,
    }
  },
  { DIALOG },
)
results.values.createDialog.errorState = errorState
results.values.createDialog.narrowStatic = narrowStatic
check('字段错误态挂公共 ced-field--error，输入框红框', errorState.errorContainerCount >= 1 && /rgb\(245, 108, 108\)/.test(errorState.inputWrapperBoxShadow ?? ''), errorState)
check('错误文字挂公共 ced-field-error 且 13px / 危险色', errorState.errorTextCount >= 1 && errorState.longError?.fontSize === '13px' && errorState.longError?.color === 'rgb(245, 108, 108)', errorState.longError)
check('长错误文案在窄视口内换行（>1 行）且 overflow-wrap:anywhere', (errorState.longError?.lineCount ?? 0) > 1 && errorState.longError?.overflowWrap === 'anywhere', errorState.longError)
check('窄视口弹窗按 --ced-dialog-safety-inset 收缩且不横向溢出', narrowStatic.dialog.scrollWidth <= narrowStatic.dialog.clientWidth && narrowStatic.dialog.width <= 420 - 48 + 1, narrowStatic.dialog)
await page.setViewportSize({ width: 1280, height: 900 })
await page.waitForTimeout(200)

// ---------------------------------------------------------------- 加载态（POST 在网络层挂起，零落地）
await page.fill(`${DIALOG} .cc-id-control input`, 'probe-syn-new')
await page.fill(`${DIALOG} .cc-desc-row textarea`, '合成描述')
await page.click(`${DIALOG} .cc-opt:not([disabled])`)
await page.waitForTimeout(200)
const submitPromise = page.click(SUBMIT)
for (let i = 0; i < 60 && writeAttempts.length === 0; i++) await page.waitForTimeout(100)
await page.waitForTimeout(300)
const submitLoading = await readButton()
results.values.createDialog.submitLoading = submitLoading
check('加载态同时带 is-loading 与 is-disabled（故公共 .is-loading:not(.is-disabled) 不命中）', submitLoading.isLoadingClass && submitLoading.isDisabledClass, submitLoading)
check('加载态背景为 Feature 令牌 #3f3f46', submitLoading.backgroundColor === 'rgb(63, 63, 70)', submitLoading.backgroundColor)
check('加载态白字 + 不可重复点击游标', submitLoading.color === 'rgb(255, 255, 255)' && submitLoading.cursor === 'not-allowed', submitLoading)
check('加载态遮罩 ::before 被透明化', submitLoading.maskBeforeBg === 'rgba(0, 0, 0, 0)', submitLoading.maskBeforeBg)

if (releaseHeldWrite) releaseHeldWrite()
await submitPromise.catch(() => {})
await page.waitForTimeout(600)
// 把指针移出按钮，避免读到 hover 态而误判“恢复常态”。
await page.mouse.move(5, 5)
await page.waitForTimeout(250)
const submitRestored = await readButton()
results.values.createDialog.submitRestored = submitRestored
check('请求被拦截后按钮恢复黑色常态', submitRestored.backgroundColor === 'rgb(9, 9, 11)' && !submitRestored.isLoadingClass && !submitRestored.isDisabledClass, submitRestored)

// ---------------------------------------------------------------- 编辑弹窗：同类挂载
await page.keyboard.press('Escape')
await page.waitForTimeout(400)
await page.dblclick('.cc-table tbody tr:nth-child(1)')
await page.waitForSelector(DIALOG, { timeout: 10000 })
await page.waitForTimeout(300)
const editProvenance = await readPresetProvenance()
const editStatic = await readStaticStyles()
const editCounts = await countCed()
const editSubmit = await readButton()
results.values.editDialog = { provenance: editProvenance, staticStyles: editStatic, counts: editCounts, submit: editSubmit }
check('编辑弹窗同挂根类与公共标签类', editProvenance.rootClassName === 'el-dialog cc-dialog ced-dialog' && editStatic.label.fontSize === '14px' && editStatic.row.gap === '12px', editProvenance.rootClassName)
check(
  '编辑弹窗主提交按钮（保存）仍为黑色实心且仅它挂 ced-submit；“取消”与“修改探针 ID”均不挂',
  editSubmit.backgroundColor === 'rgb(9, 9, 11)' &&
    editCounts.cedSubmit === 1 &&
    editStatic.nonTargetButtons.some((b) => b.text === '取消' && !b.hasCedSubmit) &&
    editStatic.idToggle?.text === '修改探针 ID' &&
    editStatic.idToggle?.hasCedSubmit === false &&
    editStatic.idToggle?.hasCcSubmit === false,
  { editSubmit, footerButtons: editStatic.nonTargetButtons, idToggle: editStatic.idToggle },
)

// ---------------------------------------------------------------- 只读对照：/config/data-source 零变化
await page.goto(`${BASE}/config/data-source`, { waitUntil: 'networkidle' })
await page.waitForTimeout(500)
const dsCounts = await countCed()
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find((b) => /新增数据源/.test(b.textContent))
  btn?.click()
})
await page.waitForTimeout(600)
const dsAfterOpen = await page.evaluate(() => {
  const dlg = document.querySelector('.el-dialog.editor-dialog')
  return {
    cedDialogCount: document.querySelectorAll('.ced-dialog').length,
    cedSubmitCount: document.querySelectorAll('.ced-submit').length,
    editorDialogClassName: dlg?.className ?? null,
    editorDialogWidth: dlg ? +dlg.getBoundingClientRect().width.toFixed(2) : null,
    submitBg: dlg
      ? getComputedStyle(dlg.querySelector('.editor-submit-button')).backgroundColor
      : null,
  }
})
results.values.dataSourceReference = { beforeOpen: dsCounts, afterOpen: dsAfterOpen }
check('数据源管理页面 ced-* 挂载计数为 0（含打开其主弹窗后）', dsAfterOpen.cedDialogCount === 0 && dsAfterOpen.cedSubmitCount === 0, dsAfterOpen)
check('数据源管理主弹窗类名与提交按钮视觉未被波及', dsAfterOpen.editorDialogClassName === 'el-dialog editor-dialog' && dsAfterOpen.submitBg === 'rgb(9, 9, 11)', dsAfterOpen)

results.writeSummary = {
  nonGetAttempts: writeAttempts,
  nonGetReachedBackend: 0,
  blockedByClient: 'aborted at browser routing layer, never forwarded to the Vite proxy',
  readGetsFulfilledByStub: readCalls.length,
}

fs.writeFileSync(path.join(OUT, 'dialog-adoption-results.json'), JSON.stringify(results, null, 2))

const failed = results.checks.filter((c) => !c.ok)
console.log(
  JSON.stringify(
    {
      passed: results.checks.length - failed.length,
      total: results.checks.length,
      failed,
      writeSummary: results.writeSummary,
      outcomes: results.checks.map((c) => `${c.ok ? 'PASS' : 'FAIL'} ${c.name}`),
    },
    null,
    2,
  ),
)

await browser.close()
process.exit(failed.length === 0 ? 0 : 1)
