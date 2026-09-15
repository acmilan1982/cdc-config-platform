/**
 * 真实 Chromium 原始几何采样器（零依赖，CDP + Node 内建 WebSocket）。
 *
 * 采样纪律（任务提示词 §9.3）：
 *   - 值一律取未舍入的 getBoundingClientRect() / clientWidth 等原始浮点；
 *   - 长/短结果都通过“真实页面 GET 查询”构造：默认全量查询 ≈ 30 行（长），
 *     在真实控件里选中 clientId=hosp-012 后点击“查询”得到 1 行（短）；
 *   - 不删除 DOM 行、不写死 CSS 高度、不改响应、不打补丁 fetch、不裁剪截图。
 *
 * 用法：
 *   node sample-browser.mjs --cdp-port 9222 --origin http://192.168.174.70:5173 --out <dir>
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { CdpSession, openPage, evaluate, waitFor, clickSelector, pressEscape, waitPopperClosed, waitPopperOpen, clickVisiblePopperOption } from './cdp-client.mjs'

const args = new Map()
for (let i = 2; i < process.argv.length; i += 2) args.set(process.argv[i].replace(/^--/, ''), process.argv[i + 1])
const CDP_PORT = Number(args.get('cdp-port') ?? 9222)
const ORIGIN = args.get('origin') ?? 'http://192.168.174.70:5173'
const OUT_DIR = args.get('out') ?? '.'
const PAGE_PATH = '/monitor/data-source-state'
const SHORT_CLIENT_ID = 'hosp-012'
const EXPECTED_SHORT_ROWS = 1
const EXPECTED_LONG_ROWS = 30

const VIEWPORTS = [
  { width: 1280, height: 800, dpr: 1 },
  { width: 1700, height: 920, dpr: 1 },
  { width: 1920, height: 1080, dpr: 1 },
  { width: 2560, height: 1440, dpr: 1 },
]

// ---------------------------------------------------------------------------
// 页面内采样：原样返回未舍入数值
// ---------------------------------------------------------------------------
const SAMPLE_FN = `(() => {
  const rect = (el) => { const b = el.getBoundingClientRect(); return { x: b.x, y: b.y, width: b.width, height: b.height }; }
  const q = (s) => document.querySelector(s)
  const area = q('.content-area')
  if (!area) return { error: 'no .content-area' }
  const ths = [...document.querySelectorAll('.dss-table .el-table__header-wrapper th')]
  const labelOf = (th) => (th.querySelector('.cell')?.textContent ?? '').trim()
  const rows = document.querySelectorAll('.dss-table .el-table__body-wrapper tbody tr.el-table__row')
  const btn = (s) => q(s)
  return {
    ts: Date.now(),
    viewport: {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
      visualViewportWidth: window.visualViewport ? window.visualViewport.width : null,
    },
    documentElementClientWidth: document.documentElement.clientWidth,
    documentElementScrollHeight: document.documentElement.scrollHeight,
    contentArea: {
      rect: rect(area),
      clientWidth: area.clientWidth,
      scrollWidth: area.scrollWidth,
      clientHeight: area.clientHeight,
      scrollHeight: area.scrollHeight,
      hasVerticalScrollNeed: area.scrollHeight > area.clientHeight,
      scrollbarGutterComputed: getComputedStyle(area).scrollbarGutter,
      overflowYComputed: getComputedStyle(area).overflowY,
      hasPrivateGutterClass: area.classList.contains('dss-stable-gutter'),
      className: area.className,
      scrollbarOccupiesSpace: area.getBoundingClientRect().width - area.clientWidth,
    },
    buttons: {
      query: btn('.dss-query-btn') ? Object.assign(rect(btn('.dss-query-btn')), { widthCss: getComputedStyle(btn('.dss-query-btn')).width, minWidthCss: getComputedStyle(btn('.dss-query-btn')).minWidth, maxWidthCss: getComputedStyle(btn('.dss-query-btn')).maxWidth, flexBasisCss: getComputedStyle(btn('.dss-query-btn')).flexBasis, spinnerVisible: !!q('.dss-query-btn .dss-btn-spinner.is-visible') }) : null,
      reset: btn('.dss-reset-btn') ? Object.assign(rect(btn('.dss-reset-btn')), { widthCss: getComputedStyle(btn('.dss-reset-btn')).width, minWidthCss: getComputedStyle(btn('.dss-reset-btn')).minWidth, maxWidthCss: getComputedStyle(btn('.dss-reset-btn')).maxWidth, flexBasisCss: getComputedStyle(btn('.dss-reset-btn')).flexBasis, text: (btn('.dss-reset-btn').textContent || '').trim() }) : null,
      refresh: btn('.dss-refresh-btn') ? Object.assign(rect(btn('.dss-refresh-btn')), { widthCss: getComputedStyle(btn('.dss-refresh-btn')).width, minWidthCss: getComputedStyle(btn('.dss-refresh-btn')).minWidth, maxWidthCss: getComputedStyle(btn('.dss-refresh-btn')).maxWidth, flexBasisCss: getComputedStyle(btn('.dss-refresh-btn')).flexBasis, spinnerVisible: !!q('.dss-refresh-btn .dss-btn-spinner.is-visible'), text: (btn('.dss-refresh-btn').textContent || '').trim() }) : null,
    },
    queryActions: btn('.dss-q-actions') ? rect(q('.dss-q-actions')) : null,
    queryBar: btn('.dss-query-bar') ? rect(q('.dss-query-bar')) : null,
    resultCard: btn('.dss-table-wrap') ? rect(q('.dss-table-wrap')) : null,
    tableFrame: btn('.dss-table') ? rect(q('.dss-table')) : null,
    tableHeaderWrapper: q('.dss-table .el-table__header-wrapper') ? rect(q('.dss-table .el-table__header-wrapper')) : null,
    headers: ths.map((th, i) => Object.assign({ index: i, label: labelOf(th) }, rect(th))),
    rowCount: rows.length,
    seqCells: [...document.querySelectorAll('.dss-table .dss-seq')].map((n) => n.textContent.trim()),
  }
})()`

const ROUTE_FN = `({ path: location.pathname, title: document.title })`

async function sample(cdp, sessionId, tag, store) {
  const raw = await evaluate(cdp, sessionId, SAMPLE_FN)
  if (raw.error) throw new Error(`sampling failed: ${raw.error}`)
  raw.route = await evaluate(cdp, sessionId, ROUTE_FN)
  raw.tag = tag
  store.push(raw)
  return raw
}

/** 整视口截图（不裁剪）；截图为辅助证据，判定只依据原始几何值。 */
async function screenshot(cdp, sessionId, dir, tag) {
  const shot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }, sessionId)
  const file = join(dir, `${tag}.png`)
  writeFileSync(file, Buffer.from(shot.data, 'base64'))
  return file
}

function setMetrics(cdp, sessionId, vp) {
  return cdp.send(
    'Emulation.setDeviceMetricsOverride',
    {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: vp.dpr,
      mobile: false,
      screenWidth: vp.width,
      screenHeight: vp.height,
    },
    sessionId,
  )
}

/**
 * 真实点击打开探针端下拉；Element Plus 的开关是切换语义，个别时机下首次点击可能被吞掉，
 * 因此按“点了不弹就再点一次”重试（每次都是真实鼠标事件，不做任何 DOM 伪造）。
 */
async function openClientPopper(cdp, sessionId, label = '') {
  for (let attempt = 1; attempt <= 3; attempt++) {
    await clickSelector(cdp, sessionId, '.dss-client-select .el-select__wrapper')
    try {
      await waitPopperOpen(cdp, sessionId, '.dss-client-popper', 2500)
      await delay(400)
      const visible = await evaluate(
        cdp,
        sessionId,
        `(() => { const pops = [...document.querySelectorAll('.dss-client-popper')].filter((el) => { const cs = getComputedStyle(el); return cs.display !== 'none' && cs.visibility !== 'hidden' && el.getBoundingClientRect().height > 0 }); return pops.length })()`,
      )
      if (visible > 0) return
    } catch {
      /* 重试 */
    }
    console.log(`[${label}] client popper open attempt ${attempt} failed, retrying`)
    await delay(400)
  }
  throw new Error(`[${label}] client popper did not open after 3 real click attempts`)
}

/** 在真实控件里选中 clientId=hosp-012（真实鼠标，先滚入可见区，命中测试通过后才算成功）。 */
async function selectShortClientFilter(cdp, sessionId, label = '') {
  await openClientPopper(cdp, sessionId, label)
  await clickVisiblePopperOption(cdp, sessionId, 'dss-client-popper', 'data-dss-client-id', SHORT_CLIENT_ID)
  // 断言选中真的生效：查询区草稿里出现该具体值（不再停留在“全部”）
  await waitFor(
    cdp,
    sessionId,
    `(() => { const t = document.querySelector('.dss-client-select').textContent || ''; return t.includes(${JSON.stringify(SHORT_CLIENT_ID)}) })()`,
    { label: `${label} client filter selection applied` },
  )
  await pressEscape(cdp, sessionId)
  await waitPopperClosed(cdp, sessionId, '.dss-client-popper')
}

/** 真实点击“查询”并等待请求结算。 */
async function clickQueryAndSettle(cdp, sessionId, label) {
  await clickSelector(cdp, sessionId, '.dss-query-btn')
  await waitFor(cdp, sessionId, `!document.querySelector('.dss-query-btn .dss-btn-spinner.is-visible')`, {
    label: `${label} settled`,
  })
}

export async function run() {
  mkdirSync(OUT_DIR, { recursive: true })
  const SHOT_DIR = join(OUT_DIR, 'screenshots')
  mkdirSync(SHOT_DIR, { recursive: true })
  const consoleErrors = []
  const networkRequests = []
  const wsUrl = await CdpSession.discover(CDP_PORT)
  const cdp = await CdpSession.connect(wsUrl)
  const { sessionId } = await openPage(cdp, 'about:blank')
  await cdp.send('Network.enable', {}, sessionId)

  cdp.on('Runtime.consoleAPICalled', (p) => {
    if (p.type === 'error') consoleErrors.push({ kind: 'console.error', text: p.args.map((a) => a.value ?? a.description ?? a.type).join(' ') })
  })
  cdp.on('Runtime.exceptionThrown', (p) => {
    consoleErrors.push({ kind: 'exception', text: p.exceptionDetails?.exception?.description ?? p.exceptionDetails?.text })
  })
  cdp.on('Log.entryAdded', (p) => {
    if (p.entry.level === 'error') consoleErrors.push({ kind: `log.${p.entry.source}`, text: p.entry.text })
  })
  cdp.on('Network.requestWillBeSent', (p) => {
    networkRequests.push({ method: p.request.method, url: p.request.url, type: p.type })
  })

  const result = {
    meta: {
      generatedAt: new Date().toISOString(),
      origin: ORIGIN,
      pagePath: PAGE_PATH,
      shortClientId: SHORT_CLIENT_ID,
      expectedLongRows: EXPECTED_LONG_ROWS,
      expectedShortRows: EXPECTED_SHORT_ROWS,
      viewports: VIEWPORTS,
      samplingMode: 'REAL_PAGE_GET_QUERY',
    },
    longSamples: [],
    shortSamples: [],
    extra: {},
    consoleErrors,
    networkRequests,
  }

  // 首个视口先做一次真实导航与初始自动查询等待
  await setMetrics(cdp, sessionId, VIEWPORTS[0])
  await cdp.send('Page.navigate', { url: `${ORIGIN}${PAGE_PATH}` }, sessionId)
  await waitFor(cdp, sessionId, `document.querySelector('.dss-table .el-table__body-wrapper tbody tr.el-table__row')`, { label: 'initial rows' })
  await waitFor(cdp, sessionId, `!document.querySelector('.dss-query-btn .dss-btn-spinner.is-visible')`, { label: 'initial query settled' })

  for (const vp of VIEWPORTS) {
    const vtag = `${vp.width}x${vp.height}`
    console.log(`[viewport ${vtag}] begin`)
    await setMetrics(cdp, sessionId, vp)
    await delay(250)

    // 确保长结果态：点“重置”后点“查询” → 三项回到“全部” → 真实 GET 全量查询
    await clickSelector(cdp, sessionId, '.dss-reset-btn')
    await clickQueryAndSettle(cdp, sessionId, `${vtag} long`)
    await waitFor(cdp, sessionId, `document.querySelectorAll('.dss-table .el-table__body-wrapper tbody tr.el-table__row').length === ${EXPECTED_LONG_ROWS}`, { label: `${vtag} long row count` })
    await delay(200)
    const long = await sample(cdp, sessionId, `${vtag}-LONG`, result.longSamples)
    long.screenshot = await screenshot(cdp, sessionId, SHOT_DIR, `${vtag}-LONG`)
    console.log(`[viewport ${vtag}] long rows=${long.rowCount} scrollNeed=${long.contentArea.hasVerticalScrollNeed} clientWidth=${long.contentArea.clientWidth}`)

    // 构造短结果态：真实控件交互选中 clientId=hosp-012，再点“查询”
    await selectShortClientFilter(cdp, sessionId, vtag)
    await clickQueryAndSettle(cdp, sessionId, `${vtag} short`)
    await waitFor(cdp, sessionId, `document.querySelectorAll('.dss-table .el-table__body-wrapper tbody tr.el-table__row').length === ${EXPECTED_SHORT_ROWS}`, { label: `${vtag} short row count` })
    await delay(200)
    const short = await sample(cdp, sessionId, `${vtag}-SHORT`, result.shortSamples)
    short.screenshot = await screenshot(cdp, sessionId, SHOT_DIR, `${vtag}-SHORT`)

    result.extra[`${vtag}_longRows`] = long.rowCount
    result.extra[`${vtag}_shortRows`] = short.rowCount
    result.extra[`${vtag}_longScrollNeed`] = long.contentArea.hasVerticalScrollNeed
    result.extra[`${vtag}_shortScrollNeed`] = short.contentArea.hasVerticalScrollNeed
    console.log(`[viewport ${vtag}] short rows=${short.rowCount} scrollNeed=${short.contentArea.hasVerticalScrollNeed} clientWidth=${short.contentArea.clientWidth}`)
  }

  // ---- §9.5 路由隔离：切到其他真实路由 → 私有 class 消失且计算值不被全局强制 stable → 切回目标路由恢复
  const routeIsolation = []
  const routeAssert = async (path, expectGutter) => {
    await cdp.send('Page.navigate', { url: `${ORIGIN}${path}` }, sessionId)
    await waitFor(cdp, sessionId, `document.querySelector('.content-area')`, { label: `route ${path} content-area` })
    await delay(900)
    const s = await evaluate(cdp, sessionId, SAMPLE_FN)
    routeIsolation.push({
      path,
      expectedPrivateClass: expectGutter,
      hasPrivateClass: s.contentArea.hasPrivateGutterClass,
      scrollbarGutterComputed: s.contentArea.scrollbarGutterComputed,
      overflowYComputed: s.contentArea.overflowYComputed,
      className: s.contentArea.className,
    })
  }
  result.extra.otherRoutesProbed = ['/config/data-source', '/config/client', '/monitor/cdc-node']
  await routeAssert('/config/data-source', false)
  await routeAssert('/config/client', false)
  await routeAssert('/monitor/cdc-node', false)
  await routeAssert(PAGE_PATH, true)
  result.routeIsolation = routeIsolation

  // ---- §9.5 重置语义：只恢复条件、不立即发起查询；重置后再点查询 → 恢复长结果
  await setMetrics(cdp, sessionId, VIEWPORTS[1])
  await delay(200)
  await selectShortClientFilter(cdp, sessionId)
  await clickQueryAndSettle(cdp, sessionId, 'reset-semantics short')
  await waitFor(cdp, sessionId, `document.querySelectorAll('.dss-table .el-table__body-wrapper tbody tr.el-table__row').length === ${EXPECTED_SHORT_ROWS}`, { label: 'reset-semantics short rows' })
  const beforeResetRequests = networkRequests.length
  await clickSelector(cdp, sessionId, '.dss-reset-btn')
  await delay(1200)
  const afterResetRows = await evaluate(cdp, sessionId, `document.querySelectorAll('.dss-table .el-table__body-wrapper tbody tr.el-table__row').length`)
  const afterResetRequests = networkRequests.length
  const resetInstantRequests = networkRequests
    .slice(beforeResetRequests)
    .filter((r) => r.url.includes('/api/monitor/data-source-run-state/list'))
  const afterResetPlaceholders = await evaluate(
    cdp,
    sessionId,
    `[...document.querySelectorAll('.dss-query-bar .el-select__wrapper .el-select__selected-item')].map(n => (n.textContent||'').trim())`,
  )
  await clickSelector(cdp, sessionId, '.dss-query-btn')
  await waitFor(cdp, sessionId, `!document.querySelector('.dss-query-btn .dss-btn-spinner.is-visible')`, { label: 'post-reset query settled' })
  await waitFor(cdp, sessionId, `document.querySelectorAll('.dss-table .el-table__body-wrapper tbody tr.el-table__row').length === ${EXPECTED_LONG_ROWS}`, { label: 'post-reset query long rows' })
  const afterResetQueryRows = await evaluate(cdp, sessionId, `document.querySelectorAll('.dss-table .el-table__body-wrapper tbody tr.el-table__row').length`)
  const afterResetQueryRequests = networkRequests.length

  result.resetSemantics = {
    rowsBeforeReset: EXPECTED_SHORT_ROWS,
    rowsImmediatelyAfterReset: afterResetRows,
    listRequestsImmediatelyAfterReset: resetInstantRequests.length,
    listRequestUrlsImmediatelyAfterReset: resetInstantRequests.map((r) => r.url),
    selectedPlaceholdersAfterReset: afterResetPlaceholders,
    rowsAfterPostResetQuery: afterResetQueryRows,
    listRequestsDeltaOnPostResetQuery: afterResetQueryRequests - afterResetRequests,
  }

  // ---- §9.5 请求在途期间按钮几何稳定性：Loading / 成功期间“查询”“重置”“立即刷新”自矩形不得位移
  await setMetrics(cdp, sessionId, VIEWPORTS[0])
  await delay(300)
  const frameProbe = `(() => {
    const r = (s) => { const el = document.querySelector(s); if (!el) return null; const b = el.getBoundingClientRect(); return { x: b.x, y: b.y, width: b.width, height: b.height } }
    return {
      t: performance.now(),
      query: r('.dss-query-btn'),
      reset: r('.dss-reset-btn'),
      refresh: r('.dss-refresh-btn'),
      querySpinnerVisible: !!document.querySelector('.dss-query-btn .dss-btn-spinner.is-visible'),
      refreshSpinnerVisible: !!document.querySelector('.dss-refresh-btn .dss-btn-spinner.is-visible'),
      queryText: (document.querySelector('.dss-query-btn')?.textContent || '').trim(),
      resetText: (document.querySelector('.dss-reset-btn')?.textContent || '').trim(),
      refreshText: (document.querySelector('.dss-refresh-btn')?.textContent || '').trim(),
      queryAriaBusy: document.querySelector('.dss-query-btn')?.getAttribute('aria-busy') ?? null,
    }
  })()`

  const loadingFrames = []
  loadingFrames.push(await evaluate(cdp, sessionId, frameProbe)) // idle 基线帧
  await clickSelector(cdp, sessionId, '.dss-query-btn')
  for (let i = 0; i < 40; i++) {
    loadingFrames.push(await evaluate(cdp, sessionId, frameProbe))
    await delay(30)
  }
  loadingFrames.push(await evaluate(cdp, sessionId, frameProbe)) // 结算后帧

  result.loadingStability = {
    frameCount: loadingFrames.length,
    framesWithQuerySpinner: loadingFrames.filter((f) => f.querySpinnerVisible).length,
    frames: loadingFrames,
  }

  // ---- 网络写操作统计（页面不得发出非 GET 请求）
  result.networkSummary = {
    total: networkRequests.length,
    nonGet: networkRequests.filter((r) => r.method !== 'GET').map((r) => ({ method: r.method, url: r.url })),
    listApiGetCount: networkRequests.filter((r) => r.url.includes('/api/monitor/data-source-run-state/list') && r.method === 'GET').length,
  }

  cdp.close()
  writeFileSync(join(OUT_DIR, 'raw-geometry.json'), JSON.stringify(result, null, 2))
  return result
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run()
    .then((r) => {
      console.log(`SAMPLED long=${r.longSamples.length} short=${r.shortSamples.length} consoleErrors=${r.consoleErrors.length} nonGet=${r.networkSummary.nonGet.length}`)
    })
    .catch((e) => {
      console.error(`SAMPLER_FAILED: ${e.message}`)
      process.exit(1)
    })
}
