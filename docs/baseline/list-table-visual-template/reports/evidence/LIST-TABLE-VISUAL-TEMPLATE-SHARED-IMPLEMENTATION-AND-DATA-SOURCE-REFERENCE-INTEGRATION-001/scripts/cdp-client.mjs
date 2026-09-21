/**
 * 零依赖 CDP 客户端（Node >= 22，使用内建全局 WebSocket / fetch）。
 * 本仓库任何位置均未安装 playwright / puppeteer，故直接走 Chrome DevTools Protocol。
 */
import { setTimeout as delay } from 'node:timers/promises'

export class CdpSession {
  #ws
  #nextId = 1
  #pending = new Map()
  #listeners = new Map()

  static async connect(wsUrl) {
    const s = new CdpSession()
    await s.#open(wsUrl)
    return s
  }

  /** 通过 http://host:port/json/version 发现 browser 级 WebSocket 端点。 */
  static async discover(port, host = '127.0.0.1') {
    const res = await fetch(`http://${host}:${port}/json/version`)
    return (await res.json()).webSocketDebuggerUrl
  }

  #open(wsUrl) {
    return new Promise((resolve, reject) => {
      this.#ws = new WebSocket(wsUrl)
      this.#ws.addEventListener('open', () => resolve())
      this.#ws.addEventListener('error', (e) => reject(new Error(`ws error: ${e.message ?? e.type}`)))
      this.#ws.addEventListener('message', (ev) => {
        let msg
        try {
          msg = JSON.parse(ev.data)
        } catch {
          return
        }
        if (msg.id !== undefined && this.#pending.has(msg.id)) {
          const { resolve, reject } = this.#pending.get(msg.id)
          this.#pending.delete(msg.id)
          if (msg.error) reject(new Error(`${msg.error.message} (code ${msg.error.code})`))
          else resolve(msg.result)
          return
        }
        if (msg.method) {
          for (const fn of this.#listeners.get(msg.method) ?? []) fn(msg.params, msg.sessionId)
        }
      })
    })
  }

  on(method, fn) {
    if (!this.#listeners.has(method)) this.#listeners.set(method, [])
    this.#listeners.get(method).push(fn)
  }

  send(method, params = {}, sessionId) {
    const id = this.#nextId++
    const payload = { id, method, params }
    if (sessionId) payload.sessionId = sessionId
    return new Promise((resolve, reject) => {
      this.#pending.set(id, { resolve, reject })
      this.#ws.send(JSON.stringify(payload))
    })
  }

  close() {
    try {
      this.#ws.close()
    } catch {
      /* ignore */
    }
  }
}

/** 打开一个 page target 并以 flatten 模式返回其 sessionId。 */
export async function openPage(cdp, url = 'about:blank') {
  const { targetId } = await cdp.send('Target.createTarget', { url })
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true })
  await cdp.send('Page.enable', {}, sessionId)
  await cdp.send('Runtime.enable', {}, sessionId)
  await cdp.send('Log.enable', {}, sessionId)
  return { targetId, sessionId }
}

/** 在页面内求值，返回 JSON 可序列化结果；异常直接抛出（不静默吞掉）。 */
export async function evaluate(cdp, sessionId, expression, { awaitPromise = true } = {}) {
  const r = await cdp.send(
    'Runtime.evaluate',
    { expression, returnByValue: true, awaitPromise },
    sessionId,
  )
  if (r.exceptionDetails) {
    throw new Error(
      `page evaluation failed: ${r.exceptionDetails.exception?.description ?? r.exceptionDetails.text}`,
    )
  }
  return r.result.value
}

/** 轮询等待页面内表达式为真。 */
export async function waitFor(cdp, sessionId, expression, { timeoutMs = 30000, label = expression } = {}) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const ok = await evaluate(cdp, sessionId, `(() => { try { return !!(${expression}) } catch { return false } })()`)
    if (ok) return
    await delay(100)
  }
  throw new Error(`waitFor timeout after ${timeoutMs}ms: ${label}`)
}

/**
 * 真实鼠标点击（Input 域），不使用 element.click()。
 *  - 命中前先把目标滚入最近可滚动祖先的可见区（Element Plus 下拉列表超出 max-height 时会裁剪）：
 *    这是真实用户滚动后点击的等价操作，不删除任何节点、不改布局；
 *  - 位移后做命中测试：点击点上最顶层节点必须是目标本身或其子节点（或目标含该节点），
 *    否则抛错而不是把点击落到别的元素上（防止“点了但没生效”被静默当成通过）。
 */
export async function clickSelector(
  cdp,
  sessionId,
  selector,
  { index = 0, scrollIntoView = true, timeoutMs = 6000 } = {},
) {
  const deadline = Date.now() + timeoutMs
  let last = null
  while (Date.now() < deadline) {
    last = await evaluate(
      cdp,
      sessionId,
      `(() => {
        const el = document.querySelectorAll(${JSON.stringify(selector)})[${index}]
        if (!el) return { err: 'missing' }
        // 只滚动目标最近的“可滚动祖先”（如下拉列表容器），不回退到 documentElement/body：
        // 滚动整页会让 popper 重新定位甚至收起，且并非真实用户操作路径。
        ${
          scrollIntoView
            ? `let p = el.parentElement
        while (p && p !== document.body && p !== document.documentElement) {
          const cs = getComputedStyle(p)
          if (/(auto|scroll)/.test(cs.overflowY) && p.scrollHeight > p.clientHeight + 1) {
            const er = el.getBoundingClientRect()
            const pr = p.getBoundingClientRect()
            p.scrollTop += (er.top + er.height / 2) - (pr.top + pr.height / 2)
            break
          }
          p = p.parentElement
        }`
            : ''
        }
        const b = el.getBoundingClientRect()
        if (b.width === 0 || b.height === 0) return { err: 'zero-size' }
        const x = b.x + b.width / 2
        const y = b.y + b.height / 2
        const top = document.elementFromPoint(x, y)
        const hit = !!top && (top === el || el.contains(top) || top.contains(el))
        return { x, y, hit, topClass: top ? top.className + '|' + top.tagName : null, rect: { x: b.x, y: b.y, w: b.width, h: b.height } }
      })()`,
    )
    if (!last.err && last.hit) break
    // 下拉 popper 有进入过渡：元素先落 DOM、尺寸为 0；等布局稳定后再命中测试。
    await delay(80)
  }
  if (last.err) throw new Error(`click target not clickable (${last.err}): ${selector}[${index}]`)
  if (!last.hit) {
    throw new Error(
      `click hit-test failed for ${selector}[${index}] after ${timeoutMs}ms: topmost element is ${last.topClass} rect=${JSON.stringify(last.rect)}`,
    )
  }
  const common = { x: last.x, y: last.y, button: 'left', clickCount: 1 }
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...common }, sessionId)
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', ...common }, sessionId)
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...common }, sessionId)
}

/**
 * 在“当前真正可见”的下拉 popper 内真实点击某个候选项。
 * Element Plus 关闭后会把 popper 留在 DOM 里并置 display:none；document.querySelector 会命中
 * 这些历史实例（尺寸恒为 0），因此必须先按可见性解析作用域，再在其内定位候选项。
 */
export async function clickVisiblePopperOption(cdp, sessionId, popperClassName, attrName, attrValue) {
  const resolveExpr = `(() => {
    const pops = [...document.querySelectorAll('.' + ${JSON.stringify(popperClassName)})]
      .filter((el) => { const cs = getComputedStyle(el); return cs.display !== 'none' && cs.visibility !== 'hidden' && el.getBoundingClientRect().height > 0 })
    const pop = pops[pops.length - 1]
    if (!pop) return null
    const item = pop.querySelector('[' + ${JSON.stringify(attrName)} + '=' + JSON.stringify(${JSON.stringify(attrValue)}) + ']')
    if (!item) return null
    item.setAttribute('data-dss-click-target', '1')
    return true
  })()`
  const deadline = Date.now() + 8000
  let ok = false
  while (Date.now() < deadline) {
    ok = await evaluate(cdp, sessionId, resolveExpr)
    if (ok) break
    await delay(80)
  }
  if (!ok) {
    throw new Error(`no visible popper .${popperClassName} containing [${attrName}="${attrValue}"]`)
  }
  await clickSelector(cdp, sessionId, '[data-dss-click-target="1"]')
  await evaluate(cdp, sessionId, `(() => { const el = document.querySelector('[data-dss-click-target="1"]'); if (el) el.removeAttribute('data-dss-click-target'); return true })()`)
}

/** 真实键盘 Escape + 等待 popper 不可见（Element Plus 下拉会盖住查询按钮，必须先真实关闭）。 */
export async function pressEscape(cdp, sessionId) {
  await cdp.send(
    'Input.dispatchKeyEvent',
    { type: 'rawKeyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 },
    sessionId,
  )
  await cdp.send(
    'Input.dispatchKeyEvent',
    { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 },
    sessionId,
  )
}

/** 等待指定 popper 真正可见且完成进入过渡（元素落 DOM 早于过渡结束，过早点击会落在裁剪区外）。 */
export async function waitPopperOpen(cdp, sessionId, popperSelector, timeoutMs = 8000) {
  await waitFor(
    cdp,
    sessionId,
    `(() => { const el = document.querySelector(${JSON.stringify(popperSelector)}); if (!el) return false; const cs = getComputedStyle(el); const b = el.getBoundingClientRect(); return cs.display !== 'none' && cs.visibility !== 'hidden' && b.height > 0 })()`,
    { timeoutMs, label: `popper open ${popperSelector}` },
  )
}

/** 等待指定 popper 真正不可见（display:none 或脱离文档或 visibility 隐藏）。 */
export async function waitPopperClosed(cdp, sessionId, popperSelector, timeoutMs = 8000) {
  await waitFor(cdp, sessionId, `(() => { const el = document.querySelector(${JSON.stringify(popperSelector)}); if (!el) return true; const cs = getComputedStyle(el); return cs.display === 'none' || cs.visibility === 'hidden' })()`, { timeoutMs, label: `popper closed ${popperSelector}` })
}
