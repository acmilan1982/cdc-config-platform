// Minimal Chrome DevTools Protocol client over the global WebSocket (Node >= 22).
// Nothing is installed: this drives the real Chromium binary directly.

export class CDP {
  static async attach(host = 'http://127.0.0.1:9222') {
    const res = await fetch(`${host}/json/list`)
    const targets = await res.json()
    const page = targets.find((t) => t.type === 'page' && t.webSocketDebuggerUrl)
    if (!page) throw new Error('no page target with webSocketDebuggerUrl')
    const ws = new WebSocket(page.webSocketDebuggerUrl)
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve, { once: true })
      ws.addEventListener('error', () => reject(new Error('ws error')), { once: true })
    })
    const cdp = new CDP(ws)
    cdp.targetId = page.id
    return cdp
  }

  constructor(ws) {
    this.ws = ws
    this.seq = 0
    this.pending = new Map()
    this.listeners = new Map()
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data)
      if (msg.id !== undefined) {
        const p = this.pending.get(msg.id)
        if (!p) return
        this.pending.delete(msg.id)
        if (msg.error) p.reject(new Error(`${p.method}: ${msg.error.message}`))
        else p.resolve(msg.result)
        return
      }
      for (const fn of this.listeners.get(msg.method) ?? []) fn(msg.params ?? {})
    })
  }

  send(method, params = {}) {
    const id = ++this.seq
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject, method })
      this.ws.send(JSON.stringify({ id, method, params }))
    })
  }

  on(method, fn) {
    if (!this.listeners.has(method)) this.listeners.set(method, [])
    this.listeners.get(method).push(fn)
  }

  once(method) {
    return new Promise((resolve) => {
      const fn = (params) => {
        const arr = this.listeners.get(method)
        arr.splice(arr.indexOf(fn), 1)
        resolve(params)
      }
      this.on(method, fn)
    })
  }

  async evaluate(expression) {
    const r = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    })
    if (r.exceptionDetails) {
      throw new Error(`evaluate failed: ${r.exceptionDetails.text} ${r.exceptionDetails.exception?.description ?? ''}`)
    }
    return r.result.value
  }

  close() {
    this.ws.close()
  }
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
