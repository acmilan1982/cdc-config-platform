/**
 * 隔离合成夹具 · 真实浏览器证据驱动（无 playwright/puppeteer，直接走 CDP）。
 *
 * 只读取仓库中已提交的公共 CSS 工件（内联进夹具 <style>），并用合成 DOM 结构验证：
 * 私有表单标签 / EP 标签排版、主提交按钮状态、星号 opt-in、未接入弹窗零泄漏、
 * 错误文字换行与反馈容器、窄视口不横向溢出。
 * 不加载任何业务页面、不使用业务数据、不发任何写请求。
 */
import { spawn } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const CHROME = '/usr/bin/google-chrome'
const PORT = 9231
// 公共 CSS 工件相对本脚本定位（本脚本位于 docs/baseline/<template>/reports/evidence/<task>/）。
const CSS_PATH = fileURLToPath(
  new URL('../../../../../../frontend/src/styles/dialog/create-edit-dialog-visual.css', import.meta.url),
)
const HERE = fileURLToPath(new URL('.', import.meta.url))
const FIXTURE = `${HERE}fixture.html`
const OUT = `${HERE}computed-styles.json`

const cssArtifact = readFileSync(CSS_PATH, 'utf8')

const html = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><title>CEDVT fixture</title>
<style>
  /* 夹具模拟 Element Plus 既有全局环境（主应用 main.ts 导入 element-plus/dist/index.css），
     仅提供本验证所需的危险色变量，使 var(--el-color-danger) 有定义。 */
  :root { --el-color-danger: #f56c6c; --el-color-primary: #409eff; }
  html, body { margin: 0; padding: 0; }
  .fx-row { display: flex; align-items: flex-start; gap: 8px; }
  .fx-width { width: 900px; }
  .fx-wrap-narrow { width: 120px; word-break: break-all; }
</style>
<style id="ced-artifact">
${cssArtifact}
</style>
</head><body>
<!-- 已接入（显式 opt-in）合成弹窗 -->
<div id="root-opted" class="ced-dialog fx-width" style="--ced-label-column-width: 84px; --ced-dialog-safety-inset: 48px;">
  <div class="fx-row">
    <span id="lbl-private" class="ced-form-label">字段名称</span>
    <div class="fx-row"><input value="x"></div>
  </div>
  <div class="fx-row">
    <span id="lbl-private-req" class="ced-form-label ced-required-mark">字段二</span>
    <div class="fx-row"><input value="y"></div>
  </div>
  <div class="el-form-item fx-row">
    <label id="lbl-ep" class="el-form-item__label">字段标识</label>
    <div class="fx-row"><input value="z"></div>
  </div>
  <div class="el-form-item fx-row">
    <div id="req-ep" class="ced-required-mark">
      <label id="lbl-ep-req" class="el-form-item__label">字段二</label>
    </div>
  </div>
  <div class="fx-row">
    <button id="submit-normal" class="el-button ced-submit" type="button">创建</button>
    <button id="submit-disabled" class="el-button ced-submit is-disabled" type="button" disabled>创建</button>
    <button id="submit-loading" class="el-button ced-submit is-loading" type="button">创建</button>
    <button id="cancel" class="el-button" type="button">取消</button>
  </div>
  <div id="feedback" class="ced-field-feedback">
    <p id="err" class="ced-field-error">这是一段较长的字段级错误提示文案，用于验证在窄容器内错误文字能够按任意位置换行、不被硬裁剪，也不造成横向溢出；内容不含任何业务数据。</p>
  </div>
  <div id="field-error-wrap" class="ced-field--error fx-wrap-narrow">
    <div id="wrap" class="el-input__wrapper"><input value="v"></div>
  </div>
</div>

<!-- 未接入（无根类）对照弹窗：公共层必须零命中 -->
<div id="root-plain" class="plain-dialog fx-width">
  <span id="plain-lbl" class="ced-form-label">字段名称</span>
  <button id="plain-submit" class="el-button ced-submit" type="button">创建</button>
  <div class="ced-field-feedback"><p class="ced-field-error">x</p></div>
</div>
</body></html>`

writeFileSync(FIXTURE, html)

const chrome = spawn(
  CHROME,
  [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--allow-file-access-from-files',
    `--remote-debugging-port=${PORT}`,
    '--user-data-dir=/tmp/cedvt-chrome-profile',
    '--window-size=1280,900',
    'about:blank',
  ],
  { stdio: 'ignore' },
)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function waitForDevtools() {
  for (let i = 0; i < 150; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/version`)
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
        const h = this.events.get(msg.method)
        if (h) h(msg.params)
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
    this.events.set(method, handler)
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
  const cs = (id, pseudo) => {
    const el = document.getElementById(id);
    return el ? { _present: true, ...Object.fromEntries(
      ['fontSize','fontWeight','color','textAlign','flexBasis','backgroundColor',
       'borderTopColor','borderRadius','minHeight','marginTop','lineHeight',
       'overflowWrap','boxShadow','content','width'].map(k => [k, getComputedStyle(el, pseudo || null)[k]])
    ) } : { _present: false };
  };
  const err = document.getElementById('err');
  const opted = document.getElementById('root-opted');
  const plain = document.getElementById('root-plain');
  const rect = (el) => { const r = el.getBoundingClientRect(); return { width: +r.width.toFixed(2) }; };
  return {
    viewport: { innerWidth: window.innerWidth, scrollWidth: document.documentElement.scrollWidth },
    opted: {
      labelPrivate: cs('lbl-private'),
      labelPrivateRequiredMark: cs('lbl-private-req', '::before'),
      labelEp: cs('lbl-ep'),
      labelEpRequiredMark: cs('lbl-ep-req', '::before'),
      submitNormal: cs('submit-normal'),
      submitDisabled: cs('submit-disabled'),
      submitLoading: cs('submit-loading'),
      cancel: cs('cancel'),
      feedback: cs('feedback'),
      err: cs('err'),
      fieldErrorWrapper: cs('wrap'),
      boxWidth: rect(opted).width,
      selfOverflow: { scrollWidth: opted.scrollWidth, clientWidth: opted.clientWidth },
      errWrap: { scrollWidth: err.scrollWidth, clientWidth: err.clientWidth },
    },
    plain: {
      label: cs('plain-lbl'),
      submit: cs('plain-submit'),
      boxWidth: rect(plain).width,
    },
  };
})()`

await waitForDevtools()
const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()
const page = list.find((t) => t.type === 'page')
const cdp = await CDP.connect(page.webSocketDebuggerUrl)

await cdp.send('Page.enable')
await cdp.send('Runtime.enable')
await cdp.send('DOM.enable')
await cdp.send('CSS.enable')

const loaded = new Promise((res) => cdp.on('Page.loadEventFired', res))
await cdp.send('Page.navigate', { url: `file://${FIXTURE}` })
await loaded
await sleep(300)

const evalVar = async (expression) => {
  const r = await cdp.send('Runtime.evaluate', { expression, returnByValue: true })
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails))
  return r.result.value
}

const wide = await evalVar(PROBE)

// 强制 :hover / :active / :focus / :focus-visible 伪类，读取主提交按钮真实计算样式
const doc = await cdp.send('DOM.getDocument', { depth: -1 })
const node = await cdp.send('DOM.querySelector', {
  nodeId: doc.root.nodeId,
  selector: '#submit-normal',
})
const forced = async (classes) => {
  await cdp.send('CSS.forcePseudoState', {
    nodeId: node.nodeId,
    forcedPseudoClasses: classes,
  })
  return evalVar(`(() => { const s = getComputedStyle(document.getElementById('submit-normal'));
    return { backgroundColor: s.backgroundColor, borderTopColor: s.borderTopColor, color: s.color, outlineStyle: s.outlineStyle, outlineWidth: s.outlineWidth, outlineColor: s.outlineColor }; })()`)
}
const hover = await forced(['hover'])
const active = await forced(['active'])
const focus = await forced(['focus'])
let focusVisible
try {
  focusVisible = await forced(['focus-visible'])
} catch (err) {
  focusVisible = { error: String(err.message) }
}
await cdp.send('CSS.forcePseudoState', { nodeId: node.nodeId, forcedPseudoClasses: [] })

// 窄视口：验证公共 max-width + Feature 安全边距不横向溢出
await cdp.send('Emulation.setDeviceMetricsOverride', {
  width: 400,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false,
})
await sleep(200)
const narrow = await evalVar(PROBE)
await cdp.send('Emulation.clearDeviceMetricsOverride')

writeFileSync(
  OUT,
  JSON.stringify(
    {
      meta: { chrome: 'Google Chrome 148.0.7778.167', css: CSS_PATH },
      wide,
      hover,
      active,
      focus,
      focusVisible,
      narrow,
    },
    null,
    2,
  ),
)

console.log(
  JSON.stringify(
    { hover, active, focus, focusVisible, narrowWidth: narrow.opted.boxWidth, plainNarrowWidth: narrow.plain.boxWidth },
    null,
    2,
  ),
)
chrome.kill('SIGKILL')
process.exit(0)
