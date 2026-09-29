// Focus-ring pixel probe: proves the :focus-visible ring is rendered INSIDE the
// clipped 28x28 hit area (outline-offset:-2px) and fully visible on all four sides.
// Read-only; non-GET /api/** blocked before navigation.
import { chromium } from 'playwright'
import fs from 'fs'
import zlib from 'zlib'

const BASE = 'http://127.0.0.1:5173'
const OUT = '/tmp/rh-evidence'
fs.mkdirSync(OUT, { recursive: true })

// --- minimal PNG (8-bit RGBA, non-interlaced) decoder ---
function decodePng(buf) {
  let pos = 8
  let w = 0
  let h = 0
  let bitDepth = 0
  let colorType = 0
  const idat = []
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos)
    const type = buf.toString('ascii', pos + 4, pos + 8)
    const data = buf.subarray(pos + 8, pos + 8 + len)
    if (type === 'IHDR') {
      w = data.readUInt32BE(0)
      h = data.readUInt32BE(4)
      bitDepth = data[8]
      colorType = data[9]
    } else if (type === 'IDAT') idat.push(data)
    else if (type === 'IEND') break
    pos += 12 + len
  }
  if (bitDepth !== 8 || (colorType !== 6 && colorType !== 2))
    throw new Error(`unsupported png ${bitDepth}/${colorType}`)
  const raw = zlib.inflateSync(Buffer.concat(idat))
  const bpp = colorType === 6 ? 4 : 3
  const stride = w * bpp
  const out = Buffer.alloc(h * stride)
  let rp = 0
  for (let y = 0; y < h; y++) {
    const filter = raw[rp++]
    const line = raw.subarray(rp, rp + stride)
    rp += stride
    const cur = out.subarray(y * stride, (y + 1) * stride)
    const prev = y > 0 ? out.subarray((y - 1) * stride, y * stride) : Buffer.alloc(stride)
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? cur[x - bpp] : 0
      const b = prev[x]
      const c = x >= bpp ? prev[x - bpp] : 0
      const v = line[x]
      let val
      if (filter === 0) val = v
      else if (filter === 1) val = v + a
      else if (filter === 2) val = v + b
      else if (filter === 3) val = v + ((a + b) >> 1)
      else if (filter === 4) {
        const p = a + b - c
        const pa = Math.abs(p - a)
        const pb = Math.abs(p - b)
        const pc = Math.abs(p - c)
        val = v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)
      } else throw new Error(`bad filter ${filter}`)
      cur[x] = val & 0xff
    }
  }
  return { w, h, data: out, bpp }
}
const px = (img, x, y) => {
  const i = (y * img.w + x) * img.bpp
  return [img.data[i], img.data[i + 1], img.data[i + 2]]
}
const near = (p, t, tol = 60) =>
  Math.abs(p[0] - t[0]) <= tol && Math.abs(p[1] - t[1]) <= tol && Math.abs(p[2] - t[2]) <= tol

const writes = []
const browser = await chromium.launch({ args: ['--no-sandbox'] })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
await ctx.route('**/api/**', async (route) => {
  const m = route.request().method().toUpperCase()
  if (m === 'GET' || m === 'HEAD' || m === 'OPTIONS') return route.continue()
  writes.push({ method: m, url: route.request().url() })
  return route.abort('blockedbyclient')
})
const page = await ctx.newPage()
await page.goto(BASE + '/config/client', { waitUntil: 'networkidle', timeout: 30000 })
await page.waitForSelector('.cc-table tbody tr .lt-row-action__ellipsis', { timeout: 15000 })
await page.waitForTimeout(600)

// 真实键盘 Tab 到达三点入口
await page.evaluate(() => document.body.focus())
let reached = false
for (let i = 0; i < 60; i++) {
  await page.keyboard.press('Tab')
  reached = await page.evaluate(() =>
    document.activeElement?.classList?.contains('lt-row-action__ellipsis') ?? false,
  )
  if (reached) break
}
if (!reached) throw new Error('Tab 未到达三点入口')

const box = await page.evaluate(() => {
  const el = document.activeElement
  const r = el.getBoundingClientRect()
  const cs = getComputedStyle(el)
  return {
    x: r.x,
    y: r.y,
    w: r.width,
    h: r.height,
    outlineOffset: cs.outlineOffset,
    outlineWidth: cs.outlineWidth,
    outlineColor: cs.outlineColor,
    color: cs.color,
  }
})

// 无膨胀裁剪：只截 28x28 命中区本身；描边若溢出将被裁掉（看不到）
const clip = { x: Math.round(box.x), y: Math.round(box.y), width: 28, height: 28 }
const png = await page.screenshot({ clip })
fs.writeFileSync(`${OUT}/focus-ring-28x28.png`, png)
const img = decodePng(png)

const primary = box.color.match(/\d+/g).map(Number)
const edges = {
  top: px(img, 14, 1),
  bottom: px(img, Math.round(img.h) - 1, 14),
  left: px(img, 1, 14),
  right: px(img, Math.round(img.w) - 1, 14),
}
const corners = {
  tl: px(img, 2, 2),
  tr: px(img, Math.round(img.w) - 3, 2),
  bl: px(img, 2, Math.round(img.h) - 3),
  br: px(img, Math.round(img.w) - 3, Math.round(img.h) - 3),
}
const ringVisible =
  near(edges.top, primary) && near(edges.bottom, primary) && near(edges.left, primary) && near(edges.right, primary)

// 元素截图（含 3px 外扩）验证描边不进入 .cell 外的裁剪区
const outer = await page.screenshot({
  clip: {
    x: Math.round(box.x) - 3,
    y: Math.round(box.y) - 3,
    width: 34,
    height: 34,
  },
})
fs.writeFileSync(`${OUT}/focus-ring-outer-34x34.png`, outer)

const result = {
  tabReached: reached,
  box,
  screenshotSize: { w: img.w, h: img.h },
  edgeMidpoints: edges,
  corners,
  ringVisibleOnAllFourSides: ringVisible,
  writesBlocked: writes.length,
}
fs.writeFileSync(`${OUT}/focus-ring-pixels.json`, JSON.stringify(result, null, 2))
console.log(JSON.stringify(result, null, 2))
await browser.close()
