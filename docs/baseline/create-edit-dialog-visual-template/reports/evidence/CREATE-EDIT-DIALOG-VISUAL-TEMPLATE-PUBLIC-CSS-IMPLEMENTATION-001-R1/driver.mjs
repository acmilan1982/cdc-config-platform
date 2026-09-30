/**
 * 隔离夹具 · 真实浏览器证据驱动（R1）。
 *
 * 与 R0 的合成夹具不同，本夹具**加载项目当前依赖的真实 Element Plus 样式**
 * （`element-plus/dist/index.css`）并用**真实 Vue / Element Plus 组件**渲染 DOM
 * （`vue.esm-browser.prod.js` + `element-plus/dist/index.full.mjs`，经浏览器原生 import map）。
 *
 * 关心的既有实现事实（来自依赖源码，见报告）：
 * - EP `el-button` 的加载态**只有** `is-loading` 类（另加 HTML `disabled` 属性），**没有** `is-disabled`；
 *   其加载视觉由 `.el-button.is-loading{pointer-events:none;position:relative}` 与
 *   `.el-button.is-loading:before{...按 --el-mask-color-extra-light 的白色遮罩...}` 承担；
 * - 禁用态由 `.el-button.is-disabled{...}` 承担。
 * 因此本夹具用真实组件核对：禁用、loading（有/无 Feature 变量）、焦点可见、标签间距、
 * 以及未接入根类的零命中。
 *
 * 只为读取计算样式：不加载业务页面、不使用业务数据、不发任何写请求。
 * 静态服务仅暴露白名单中的 6 个文件（夹具 2 个 + 公共 CSS 工件 + 3 个依赖发行版文件）。
 */
import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const CHROME = '/usr/bin/google-chrome'
const HTTP_PORT = 9241
const CDP_PORT = 9232

// 全部路径相对本脚本定位（本脚本位于 docs/baseline/<template>/reports/evidence/<task>/）。
const HERE = fileURLToPath(new URL('.', import.meta.url))
const CSS_PATH = fileURLToPath(
  new URL('../../../../../../frontend/src/styles/dialog/create-edit-dialog-visual.css', import.meta.url),
)
const FRONTEND_DIR = fileURLToPath(new URL('../../../../../../frontend/', import.meta.url))
const EP_DIST = `${FRONTEND_DIR}node_modules/element-plus/dist/`
const VUE_DIST = `${FRONTEND_DIR}node_modules/vue/dist/`

const OUT = `${HERE}computed-styles.json`

// 静态服务白名单：URL → 本地文件。
const ROUTES = {
  '/fixture.html': `${HERE}fixture.html`,
  '/fixture-main.js': `${HERE}fixture-main.js`,
  '/ced.css': CSS_PATH,
  '/ep/index.css': `${EP_DIST}index.css`,
  '/ep/index.full.mjs': `${EP_DIST}index.full.mjs`,
  '/vue.js': `${VUE_DIST}vue.esm-browser.prod.js`,
}

const TYPES = {
  html: 'text/html; charset=utf-8',
  js: 'text/javascript; charset=utf-8',
  mjs: 'text/javascript; charset=utf-8',
  css: 'text/css; charset=utf-8',
}

const server = createServer((req, res) => {
  const path = (req.url ?? '/').split('?')[0]
  const file = ROUTES[path]
  if (!file) {
    res.writeHead(404, { 'content-type': 'text/plain' })
    res.end('not in allowlist')
    return
  }
  try {
    const body = readFileSync(file)
    const ext = path.split('.').pop()
    res.writeHead(200, { 'content-type': TYPES[ext] ?? 'application/octet-stream' })
    res.end(body)
  } catch (err) {
    res.writeHead(500, { 'content-type': 'text/plain' })
    res.end(String(err))
  }
})
await new Promise((r) => server.listen(HTTP_PORT, '127.0.0.1', r))

const chrome = spawn(
  CHROME,
  [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    `--remote-debugging-port=${CDP_PORT}`,
    '--user-data-dir=/tmp/cedvt-r1-chrome-profile',
    '--window-size=1280,900',
    'about:blank',
  ],
  { stdio: 'ignore' },
)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function waitForDevtools() {
  for (let i = 0; i < 150; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`)
      if (r.ok) return
    } catch {
      /* not ready */
    }
    await sleep(200)
  }
  throw new Error('devtools endpoint not ready')
}

class CDP {
  constructor(ws) {
    this.ws = ws
    this.seq = 0
    this.pending = new Map()
    this.events = new Map()
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data)
      if (msg.id && this.pending.has(msg.id)) {
        const { res, rej } = this.pending.get(msg.id)
        this.pending.delete(msg.id)
        if (msg.error) rej(new Error(JSON.stringify(msg.error)))
        else res(msg.result)
      } else if (msg.method) {
        for (const h of this.events.get(msg.method) ?? []) h(msg.params)
      }
    }
  }
  static async connect(url) {
    const ws = new WebSocket(url)
    await new Promise((res, rej) => {
      ws.onopen = res
      ws.onerror = () => rej(new Error('ws error'))
    })
    return new CDP(ws)
  }
  on(method, handler) {
    const list = this.events.get(method) ?? []
    list.push(handler)
    this.events.set(method, list)
  }
  send(method, params = {}) {
    const id = ++this.seq
    return new Promise((res, rej) => {
      this.pending.set(id, { res, rej })
      this.ws.send(JSON.stringify({ id, method, params }))
    })
  }
}

const PROBE = `(() => {
  const NUM = ['fontSize','fontWeight','color','textAlign','backgroundColor','backgroundImage',
    'borderTopColor','borderRadius','minHeight','marginTop','lineHeight','overflowWrap','boxShadow',
    'display','gap','columnGap','rowGap','alignItems','flexBasis','pointerEvents','position',
    'outlineStyle','outlineWidth','width'];
  const read = (el, pseudo) => {
    if (!el) return { _present: false };
    const s = getComputedStyle(el, pseudo || null);
    const out = { _present: true };
    for (const k of NUM) out[k] = s[k];
    if (pseudo) out.content = s.content;
    return out;
  };
  const q = (sel, pseudo) => read(document.querySelector(sel), pseudo);
  const btnFlags = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return { _present: false };
    return { _present: true, hasDisabledAttr: el.hasAttribute('disabled'),
      isDisabledClass: el.classList.contains('is-disabled'),
      isLoadingClass: el.classList.contains('is-loading'),
      className: el.className };
  };
  const epLabel = (sel) => {
    const item = document.querySelector(sel);
    if (!item) return { _present: false };
    const label = item.querySelector('.el-form-item__label');
    return { _present: true, label: read(label), star: read(label, '::before') };
  };
  const rect = (sel) => { const el = document.querySelector(sel);
    return el ? { width: +el.getBoundingClientRect().width.toFixed(2) } : { _present: false }; };
  return {
    viewport: { innerWidth: window.innerWidth, scrollWidth: document.documentElement.scrollWidth },
    epForm: {
      plain: epLabel('#ep-item-plain'),
      marked: epLabel('#ep-item-marked'),
    },
    privateForm: {
      label: q('#lbl-private'),
      labelNoGap: q('#lbl-private-nogap'),
      rowWithGap: q('#row-with-gap'),
      rowNoGap: q('#row-no-gap'),
    },
    buttons: {
      normal: q('#btn-normal'),
      disabled: q('#btn-disabled'),
      loading: q('#btn-loading'),
      loadingBefore: q('#btn-loading', '::before'),
      loadingVar: q('#btn-loading-var'),
      loadingVarBefore: q('#btn-loading-var', '::before'),
      cancel: q('#btn-cancel'),
      derived: q('#btn-derived'),
      flags: {
        normal: btnFlags('#btn-normal'),
        disabled: btnFlags('#btn-disabled'),
        loading: btnFlags('#btn-loading'),
        loadingVar: btnFlags('#btn-loading-var'),
      },
    },
    plain: {
      label: q('#plain-lbl'),
      row: q('#plain-row'),
      rowLabel: q('#plain-row-lbl'),
      submit: q('#plain-submit'),
      loading: q('#plain-loading'),
      submitFlags: btnFlags('#plain-submit'),
      loadingFlags: btnFlags('#plain-loading'),
    },
    dialog: {
      exists: !!document.querySelector('.el-dialog.ced-dialog'),
      className: document.querySelector('.el-dialog.ced-dialog')?.className ?? null,
      label: q('.el-dialog.ced-dialog .el-form-item__label'),
      width: rect('.el-dialog.ced-dialog'),
    },
    counts: {
      cedDialog: document.querySelectorAll('.ced-dialog').length,
      cedDialogInPlain: document.querySelectorAll('#plain .ced-dialog').length,
    },
  };
})()`

await waitForDevtools()
const list = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json()
const page = list.find((t) => t.type === 'page')
const cdp = await CDP.connect(page.webSocketDebuggerUrl)

await cdp.send('Page.enable')
await cdp.send('Runtime.enable')
await cdp.send('DOM.enable')
await cdp.send('CSS.enable')

// 记录每个样式表的来源 URL，用于把命中规则归属到具体文件。
const sheetUrl = new Map()
cdp.on('CSS.styleSheetAdded', ({ header }) => {
  if (header.styleSheetId) sheetUrl.set(header.styleSheetId, header.sourceURL ?? null)
})

const loaded = new Promise((res) => cdp.on('Page.loadEventFired', res))
await cdp.send('Page.navigate', { url: `http://127.0.0.1:${HTTP_PORT}/fixture.html` })
await loaded

const evalVar = async (expression) => {
  const r = await cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails))
  return r.result.value
}

// 等真实 Vue/EP 挂载（含 el-dialog 的 Teleport）。
let mount = null
for (let i = 0; i < 100; i++) {
  mount = await evalVar(
    `({ mounted: !!window.__fixtureMounted, buttons: document.querySelectorAll('button.el-button').length, dialog: !!document.querySelector('.el-dialog.ced-dialog'), error: !!document.querySelector('#app').textContent.match('error') })`,
  )
  if (mount.mounted && mount.buttons >= 8 && mount.dialog) break
  await sleep(150)
}
await sleep(300)

const wide = await evalVar(PROBE)

const doc = await cdp.send('DOM.getDocument', { depth: -1 })
const nodeFor = async (selector) =>
  (await cdp.send('DOM.querySelector', { nodeId: doc.root.nodeId, selector })).nodeId

const relevantProps = ['background', 'background-color', 'border-color', 'color', 'pointer-events',
  'position', 'border-radius', 'font-weight', 'opacity', 'cursor']
const summarize = (rules) =>
  (rules ?? []).map(({ rule }) => ({
    selector: rule.selectorList.text,
    origin: rule.origin,
    sheet: sheetUrl.get(rule.styleSheetId) ?? null,
    declarations: rule.style.cssProperties
      .filter((p) => !p.disabled && relevantProps.includes(p.name))
      .map((p) => `${p.name}: ${p.value}${p.important ? ' !important' : ''}`),
  }))

const matchedFor = async (selector) => {
  const nodeId = await nodeFor(selector)
  const m = await cdp.send('CSS.getMatchedStylesForNode', { nodeId })
  return {
    matched: summarize(m.matchedCSSRules),
    pseudo: (m.pseudoElements ?? []).map((p) => ({
      pseudoType: p.pseudoType,
      matched: summarize(p.matchedCSSRules),
    })),
  }
}

const matched = {
  loadingButton: await matchedFor('#btn-loading'),
  loadingButtonVar: await matchedFor('#btn-loading-var'),
  disabledButton: await matchedFor('#btn-disabled'),
  normalButton: await matchedFor('#btn-normal'),
}

// 强制伪类：正常按钮的 hover / active / focus / focus-visible；
// 加载按钮的 hover（验证加载态在同序特异度下仍优先于 hover 规则）。
const force = async (selector, classes) => {
  const nodeId = await nodeFor(selector)
  await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: classes })
}
const readState = (selector) =>
  evalVar(`(() => { const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return { _present: false };
    const s = getComputedStyle(el);
    return { _present: true, backgroundColor: s.backgroundColor, borderTopColor: s.borderTopColor,
      color: s.color, outlineStyle: s.outlineStyle, outlineWidth: s.outlineWidth, outlineColor: s.outlineColor }; })()`)

const forcedState = async (selector, classes, matchedSelector) => {
  await force(selector, classes)
  // EP `.el-button { transition: .1s }`：强制伪类后必须等过渡结束再读计算样式。
  await sleep(500)
  const observed = await evalVar(
    `(() => { const el = document.querySelector(${JSON.stringify(selector)});
      return { matchesHover: el.matches(':hover'), matchesActive: el.matches(':active'),
        matchesFocus: el.matches(':focus'), matchesFocusVisible: el.matches(':focus-visible') }; })()`,
  )
  const style = await readState(selector)
  const rules = matchedSelector ? await matchedFor(matchedSelector) : null
  await force(selector, [])
  return { observed, style, rules }
}

const hover = await forcedState('#btn-normal', ['hover'], '#btn-normal')
const active = await forcedState('#btn-normal', ['active'], null)
const focus = await forcedState('#btn-normal', ['focus'], null)
const focusVisible = await forcedState('#btn-normal', ['focus-visible'], null)

await force('#btn-loading', ['hover'])
await sleep(500)
const loadingHover = { style: await readState('#btn-loading'), rules: await matchedFor('#btn-loading') }
await force('#btn-loading', [])
await force('#btn-disabled', ['hover'])
await sleep(500)
const disabledHover = { style: await readState('#btn-disabled'), rules: await matchedFor('#btn-disabled') }
await force('#btn-disabled', [])

// 窄视口：验证 Feature 提供的 --ced-dialog-safety-inset 使弹窗按可用空间收缩、不横向溢出，
// 且未提供该变量的对照弹窗不被施加任何约束。
await cdp.send('Emulation.setDeviceMetricsOverride', {
  width: 400,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false,
})
await sleep(300)
const narrow = await evalVar(
  `(() => {
    const box = (sel) => { const el = document.querySelector(sel);
      if (!el) return { _present: false };
      const s = getComputedStyle(el);
      return { _present: true, width: +el.getBoundingClientRect().width.toFixed(2),
        maxWidth: s.maxWidth, scrollWidth: el.scrollWidth, clientWidth: el.clientWidth }; };
    return { innerWidth: window.innerWidth, opted: box('#opt-ep'), plain: box('#plain') };
  })()`,
)
await cdp.send('Emulation.clearDeviceMetricsOverride')

writeFileSync(
  OUT,
  JSON.stringify(
    {
      meta: {
        chrome: 'Google Chrome 148.0.7778.167',
        fixture: `http://127.0.0.1:${HTTP_PORT}/fixture.html`,
        artifactCss: CSS_PATH,
        elementPlus: readFileSync(`${FRONTEND_DIR}node_modules/element-plus/package.json`, 'utf8').match(/"version":\s*"([^"]+)"/)[1],
        vue: readFileSync(`${FRONTEND_DIR}node_modules/vue/package.json`, 'utf8').match(/"version":\s*"([^"]+)"/)[1],
        mount,
        allowlistedRoutes: Object.keys(ROUTES),
      },
      wide,
      states: { hover, active, focus, focusVisible, loadingHover, disabledHover },
      narrow,
      matched,
    },
    null,
    2,
  ),
)

console.log(
  JSON.stringify(
    {
      mount,
      counts: wide.counts,
      dialog: wide.dialog,
      buttons: wide.buttons.flags,
      states: Object.fromEntries(
        Object.entries({ hover, active, focus, focusVisible }).map(([k, v]) => [
          k,
          { observed: v.observed, style: v.style },
        ]),
      ),
      loading: {
        noVar: wide.buttons.loading.backgroundColor,
        withVar: wide.buttons.loadingVar.backgroundColor,
        mask: wide.buttons.loadingBefore.backgroundColor,
        hoverBg: loadingHover.style.backgroundColor,
      },
      disabled: { bg: wide.buttons.disabled.backgroundColor, hoverBg: disabledHover.style.backgroundColor },
      gap: {
        withGap: { display: wide.privateForm.rowWithGap.display, gap: wide.privateForm.rowWithGap.gap },
        noGap: { display: wide.privateForm.rowNoGap.display, gap: wide.privateForm.rowNoGap.gap },
        plainRow: { display: wide.plain.row.display, gap: wide.plain.row.gap },
      },
      narrow,
    },
    null,
    2,
  ),
)

chrome.kill('SIGKILL')
server.close()
process.exit(0)
