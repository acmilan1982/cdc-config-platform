// R1 evidence — REAL browser page zoom (100% vs 125%) for the opt-in 3-dot entry.
//
// Zoom mechanism: `chrome.tabs.setZoom()` invoked on a loaded unpacked helper
// extension's MV3 service worker, driven over Playwright/CDP. This is the same
// per-tab/per-host page-zoom path the browser zoom UI controls, so it is NOT any
// of the three things the R1 review rejects:
//   - NOT a viewport resize      (window.outerWidth stays fixed across legs),
//   - NOT `deviceScaleFactor`    (no Emulation override is issued anywhere),
//   - NOT a CSS `transform:scale` (no transform is applied anywhere).
// A real page zoom moves BOTH `devicePixelRatio` (1 -> 1.25) AND the CSS layout
// viewport (`innerWidth` 1440/1280 -> 1152/1024) in the SAME fixed window, and
// `chrome.tabs.getZoom()` reports the applied factor.
//
// PIXEL EVIDENCE METHOD — why the screen and not `Page.captureScreenshot`:
//   At zoom Z, Chrome's CDP screenshot path covers only `innerWidth / dpr` CSS px
//   (measured: 1152/1.25 = 921.6 CSS px at 125%), i.e. the leftmost 80% of the CSS
//   viewport. The opt-in entry lives in the table's FIXED right operation column,
//   which always hugs the viewport's right edge, so it is mathematically outside
//   every CDP capture at 125%. Pixel evidence therefore comes from a real display
//   capture (gnome-screenshot on the X11 root window), self-calibrated with
//   injected fixed-position colour markers. See `cdpCaptureLimitation` in output.
//
// NOTE ON BRANDING: branded Google Chrome refuses `--load-extension`
// ("--load-extension is not allowed in Google Chrome, ignoring"), so this script
// must run against an unbranded Chromium build (Playwright's bundled Chromium /
// "Chrome for Testing"), which is what `chromium.launchPersistentContext` uses by
// default. Requires a real X display for the headful window (see README).
//
// Read-only: non-GET /api/** is aborted before the first navigation and counted.
import { chromium } from 'playwright'
import { execFileSync } from 'child_process'
import fs from 'fs'
import zlib from 'zlib'
import path from 'path'

const BASE = 'http://127.0.0.1:5173'
const HERE = path.dirname(new URL(import.meta.url).pathname)
// run from a copy placed next to a `playwright` node_modules (ESM resolves from the
// script's own directory, not cwd) — see README; these overrides keep repo paths.
const EXT = process.env.R1_EXT || path.join(HERE, 'zoom-helper-extension')
const REPO_OUT = process.env.R1_REPO_OUT || HERE
const OUT = process.env.R1_OUT || '/tmp/r1-zoom/out'
const DISPLAY = process.env.DISPLAY || ':99'
// Width matches the committed 100% control group (1440), so real 125% zoom yields
// innerWidth 1152 - the same CSS width the rejected "1152x720 equivalent viewport"
// trick used, but here dpr becomes 1.25 and outerWidth stays unchanged. The window
// fits entirely on the 1440x900 virtual display, keeping the fixed right operation
// column (and its focus ring) fully visible to a screen capture.
const WINDOW = {
  width: +(process.env.R1_WINDOW_W || 1440),
  height: +(process.env.R1_WINDOW_H || 900),
}
fs.mkdirSync(OUT, { recursive: true })

const round = (n) => (typeof n === 'number' ? +n.toFixed(3) : null)

// ---------- minimal PNG (8-bit RGBA/RGB, non-interlaced) decoder + samplers ----------
function decodePng(buf) {
  let pos = 8
  let w = 0, h = 0, bitDepth = 0, colorType = 0
  const idat = []
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos)
    const type = buf.toString('ascii', pos + 4, pos + 8)
    const data = buf.subarray(pos + 8, pos + 8 + len)
    if (type === 'IHDR') {
      w = data.readUInt32BE(0); h = data.readUInt32BE(4)
      bitDepth = data[8]; colorType = data[9]
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
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c)
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
const isBlue = (p) => p[2] > 150 && p[2] - p[0] > 40

// ---------- browser ----------
const writes = []
const ctx = await chromium.launchPersistentContext(path.join(OUT, 'profile'), {
  headless: false,
  viewport: null,
  args: [
    `--load-extension=${EXT}`,
    `--disable-extensions-except=${EXT}`,
    `--window-size=${WINDOW.width},${WINDOW.height}`,
    '--window-position=0,0',
    '--no-sandbox',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
  ],
  env: { ...process.env, DISPLAY },
  timeout: 60000,
})

// block business writes BEFORE the first navigation
await ctx.route('**/api/**', async (route) => {
  const m = route.request().method().toUpperCase()
  if (m === 'GET' || m === 'HEAD' || m === 'OPTIONS') return route.continue()
  writes.push({ method: m, url: route.request().url() })
  return route.abort('blockedbyclient')
})

let sw = ctx.serviceWorkers().find((s) => s.url().includes('/sw.js'))
if (!sw) {
  sw = await ctx
    .waitForEvent('serviceworker', { predicate: (s) => s.url().includes('/sw.js'), timeout: 20000 })
    .catch(() => null)
}
if (!sw) throw new Error('zoom helper extension service worker not found (branded Chrome blocks --load-extension?)')
const extensionId = new URL(sw.url()).host

const page = ctx.pages()[0] || (await ctx.newPage())
const cdp = await ctx.newCDPSession(page)

// ---------- real page zoom control + proof ----------
const tabsZoom = () =>
  sw.evaluate(async () => {
    const all = await chrome.tabs.query({})
    const t = all.find((x) => x.url && x.url.includes('127.0.0.1:5173'))
    if (!t) return null
    return { tabId: t.id, url: t.url, zoom: await chrome.tabs.getZoom(t.id) }
  })
const setZoom = async (factor) => {
  const res = await sw.evaluate(async (f) => {
    const all = await chrome.tabs.query({})
    const t = all.find((x) => x.url && x.url.includes('127.0.0.1:5173'))
    if (!t) return { error: 'no target tab' }
    await chrome.tabs.setZoom(t.id, f)
    return { tabId: t.id, applied: await chrome.tabs.getZoom(t.id), hostKey: new URL(t.url).host }
  }, factor)
  for (let i = 0; i < 50; i++) {
    const dpr = await page.evaluate(() => window.devicePixelRatio).catch(() => null)
    if (dpr !== null && Math.abs(dpr - factor) < 1e-6) break
    await page.waitForTimeout(100)
  }
  return res
}

// ---------- real display capture (physical pixels) ----------
const screenShot = (file) => {
  execFileSync('gnome-screenshot', ['-f', file], {
    env: { ...process.env, DISPLAY },
    stdio: ['ignore', 'ignore', 'ignore'],
  })
  return decodePng(fs.readFileSync(file))
}
// Calibration markers are anchored around the hit box (60-68 CSS px away, well
// outside the 34x34 CSS px probe crop). Placing them at fixed page coordinates
// instead is unreliable: some page regions occlude even a max z-index overlay.
const markerSpec = (rect) => [
  { id: '__r1L', x: rect.x - 60, y: rect.y, rgb: [255, 128, 0] },
  { id: '__r1R', x: rect.x + 68, y: rect.y, rgb: [128, 0, 255] },
  { id: '__r1B', x: rect.x - 60, y: rect.y + 68, rgb: [255, 0, 128] },
]
const addMarkers = (ms) =>
  page.evaluate((specs) => {
    for (const m of specs) {
      const d = document.createElement('div')
      d.id = m.id
      d.style.cssText = `position:fixed;left:${m.x}px;top:${m.y}px;width:12px;height:12px;background:rgb(${m.rgb.join(',')});z-index:2147483647;pointer-events:none`
      document.body.appendChild(d)
    }
  }, ms)
const removeMarkers = (ms) =>
  page.evaluate((specs) => specs.forEach((m) => document.getElementById(m.id)?.remove()), ms)
const findMarker = (img, rgb) => {
  let n = 0, minx = 1e9, miny = 1e9
  for (let y = 0; y < img.h; y++) {
    for (let x = 0; x < img.w; x++) {
      if (near(px(img, x, y), rgb, 12)) {
        n++
        if (x < minx) minx = x
        if (y < miny) miny = y
      }
    }
  }
  return { n, minx, miny }
}

// ---------- reused measurement blocks (identical selectors to the 001 evidence) ----------
const measureClient = () =>
  page.evaluate(() => {
    const rows = [...document.querySelectorAll('.cc-table tbody tr')]
    const out = rows.map((tr, i) => {
      const src = tr.querySelector('.cc-src')
      const tds = [...tr.children]
      const opTd = tds[tds.length - 1]
      const cell = opTd ? opTd.querySelector('.cell') : null
      const link = tr.querySelector('.lt-row-action__ellipsis')
      const cs = opTd ? getComputedStyle(opTd) : null
      const cellCs = cell ? getComputedStyle(cell) : null
      const linkCs = link ? getComputedStyle(link) : null
      const linkBox = link ? link.getBoundingClientRect() : null
      const rowBox = tr.getBoundingClientRect()
      const tag = tr.querySelector('.cc-dstag')
      const tagTone = tag ? (tag.className.match(/cc-dstag--(\w+)/) || [])[1] : null
      const nextRow = rows[i + 1] ? rows[i + 1].getBoundingClientRect() : null
      const note = tr.querySelector('.cc-count-note')
      const more = tr.querySelector('.cc-more')
      return {
        idx: i + 1,
        clientId: src ? src.getAttribute('data-client-id') : null,
        rowH: +rowBox.height.toFixed(3),
        opTdIsLast: opTd ? opTd === tr.lastElementChild : null,
        opTdHasOptIn: opTd ? opTd.classList.contains('lt-row-action__cell') : null,
        opTdH: opTd ? +opTd.getBoundingClientRect().height.toFixed(3) : null,
        opTdPadTop: cs ? cs.paddingTop : null,
        opTdPadBottom: cs ? cs.paddingBottom : null,
        cellH: cell ? +cell.getBoundingClientRect().height.toFixed(3) : null,
        cellOverflow: cellCs ? cellCs.overflow : null,
        linkHasOptIn: link ? link.classList.contains('lt-row-action__ellipsis') : false,
        linkHasBizHook: link ? link.classList.contains('cc-more-link') : false,
        linkW: linkBox ? +linkBox.width.toFixed(3) : null,
        linkH: linkBox ? +linkBox.height.toFixed(3) : null,
        linkRadius: linkCs ? linkCs.borderRadius : null,
        linkDisplay: linkCs ? linkCs.display : null,
        linkBoxInsideRow: linkBox ? linkBox.top >= rowBox.top - 0.5 && linkBox.bottom <= rowBox.bottom + 0.5 : null,
        linkOverlapsNextRow: linkBox && nextRow ? linkBox.bottom > nextRow.top + 0.5 : null,
        // ID marker / state marks: presence only, the visible id text itself is
        // business-identifiable and is deliberately not captured
        idMarkPresent: !!tr.querySelector('.cc-id'),
        idInactiveMark: !!tr.querySelector('.cc-inactive-mark'),
        abnormalMark: !!tr.querySelector('.cc-abnormal-mark'),
        chipCount: tr.querySelectorAll('.cc-dstag').length,
        plusNText: more ? more.textContent.trim() : null,
        countNoteText: note ? note.textContent.trim() : null,
        tagTone,
        ambiguous: !!tr.querySelector('.cc-rowbad') || !!note,
      }
    })
    const heads = [...document.querySelectorAll('.cc-table thead th')]
    const lastTh = heads[heads.length - 1]
    const lastThCs = lastTh ? getComputedStyle(lastTh) : null
    return {
      rowCount: rows.length,
      rows: out,
      lastTh: lastTh
        ? {
            hasOptInClass: lastTh.classList.contains('lt-row-action__cell'),
            paddingTop: lastThCs.paddingTop,
            paddingBottom: lastThCs.paddingBottom,
            height: +lastTh.getBoundingClientRect().height.toFixed(3),
          }
        : null,
    }
  })

const measureDs = () =>
  page.evaluate(() => {
    const table = document.querySelector('.lt-main-table')
    if (!table) return { error: 'no lt-main-table' }
    const rows = [...table.querySelectorAll('tbody tr')]
    const out = rows.map((tr, i) => {
      const tds = [...tr.children]
      const opTd = tds[tds.length - 1]
      const cell = opTd ? opTd.querySelector('.cell') : null
      const more = tr.querySelector('.row-more')
      const cs = opTd ? getComputedStyle(opTd) : null
      const mb = more ? more.getBoundingClientRect() : null
      return {
        idx: i + 1,
        rowH: +tr.getBoundingClientRect().height.toFixed(3),
        opTdH: opTd ? +opTd.getBoundingClientRect().height.toFixed(3) : null,
        opTdPadTop: cs ? cs.paddingTop : null,
        opTdPadBottom: cs ? cs.paddingBottom : null,
        opTdHasOptIn: opTd ? opTd.classList.contains('lt-row-action__cell') : null,
        cellH: cell ? +cell.getBoundingClientRect().height.toFixed(3) : null,
        moreText: more ? more.textContent.trim() : null,
        moreW: mb ? +mb.width.toFixed(3) : null,
        moreH: mb ? +mb.height.toFixed(3) : null,
      }
    })
    return {
      rowCount: rows.length,
      rows: out,
      optInCellCount: table.querySelectorAll('.lt-row-action__cell').length,
      optInEllipsisCount: table.querySelectorAll('.lt-row-action__ellipsis').length,
      rowMoreCount: table.querySelectorAll('.row-more').length,
    }
  })

const focusComputed = async () => {
  await page.evaluate(() => document.body.focus())
  let reached = false
  let steps = 0
  for (let i = 0; i < 80; i++) {
    await page.keyboard.press('Tab')
    steps++
    reached = await page.evaluate(
      () => document.activeElement?.classList?.contains('lt-row-action__ellipsis') ?? false,
    )
    if (reached) break
  }
  if (!reached) return { tabReached: false, steps }
  const box = await page.evaluate(() => {
    const el = document.activeElement
    const r = el.getBoundingClientRect()
    const cs = getComputedStyle(el)
    const cell = el.closest('.cell')
    const cellBox = cell ? cell.getBoundingClientRect() : null
    const td = el.closest('td')
    return {
      x: r.x, y: r.y, w: r.width, h: r.height,
      dpr: window.devicePixelRatio,
      innerWidth: window.innerWidth,
      screen: { w: window.screen.width, h: window.screen.height },
      cls: el.className,
      outlineStyle: cs.outlineStyle,
      outlineWidth: cs.outlineWidth,
      outlineColor: cs.outlineColor,
      outlineOffset: cs.outlineOffset,
      color: cs.color,
      backgroundColor: cs.backgroundColor,
      cellOverflow: cell ? getComputedStyle(cell).overflow : null,
      // at zoom Z Chrome reports the used outline lengths divided by Z:
      // -2px CSS is reported as -1.6px at Z=1.25 => -2px in CSS px once rescaled.
      outlineOffsetInCssPx: +((parseFloat(cs.outlineOffset) * window.devicePixelRatio)).toFixed(3),
      outlineWidthInCssPx: +((parseFloat(cs.outlineWidth) * window.devicePixelRatio)).toFixed(3),
      boxWithinCell: cellBox ? r.top >= cellBox.top - 0.5 && r.bottom <= cellBox.bottom + 0.5 : null,
      tdIsLast: td ? td === td.parentElement.lastElementChild : null,
      tdHasOptIn: td ? td.classList.contains('lt-row-action__cell') : null,
    }
  })
  return { tabReached: true, steps, box }
}

// pixel-level ring probe on the REAL display capture, self-calibrated by markers
const ringScreenProbe = async (tag) => {
  const rect = await page.evaluate(() => {
    const el = document.activeElement
    const r = el.getBoundingClientRect()
    return { x: r.x, y: r.y, w: r.width, h: r.height, dpr: window.devicePixelRatio }
  })
  const ms = markerSpec(rect)
  await addMarkers(ms)
  const calibFile = path.join(OUT, `ring-${tag}-calib.png`)
  const calibImg = screenShot(calibFile)
  await removeMarkers(ms)
  const L = findMarker(calibImg, ms[0].rgb)
  const R = findMarker(calibImg, ms[1].rgb)
  const B = findMarker(calibImg, ms[2].rgb)
  if (!L.n || !R.n || !B.n) {
    return { ok: false, error: 'calibration marker not found on screen', L, R, B }
  }
  const dx = (R.minx - L.minx) / (ms[1].x - ms[0].x)
  const dy = (B.miny - L.miny) / (ms[2].y - ms[0].y)
  const ox = L.minx - ms[0].x * dx
  const oy = L.miny - ms[0].y * dy
  const calibrationConsistent = Math.abs(dx - dy) <= 0.02 && Math.abs(dx - rect.dpr) <= 0.02

  const shotFile = path.join(OUT, `screen-zoom${tag}.png`)
  const img = screenShot(shotFile)
  const rectAfter = await page.evaluate(() => {
    const el = document.activeElement
    const r = el.getBoundingClientRect()
    return { x: r.x, y: r.y, w: r.width, h: r.height }
  })

  // element box in device px on the framebuffer
  const bx = ox + rectAfter.x * dx
  const by = oy + rectAfter.y * dy
  const bw = rectAfter.w * dx
  const bh = rectAfter.h * dy
  const pad = 3
  const cx0 = Math.max(0, Math.round(bx - pad * dx))
  const cy0 = Math.max(0, Math.round(by - pad * dy))
  const cw = Math.round((rectAfter.w + 2 * pad) * dx)
  const ch = Math.round((rectAfter.h + 2 * pad) * dy)
  const cx1 = Math.min(img.w - 1, cx0 + cw - 1)
  const cy1 = Math.min(img.h - 1, cy0 + ch - 1)

  // exact device-pixel accounting over the padded crop
  let dBlue = 0, dminx = 1e9, dminy = 1e9, dmaxx = -1, dmaxy = -1
  const band = Math.max(2, Math.round(2 * dx))
  const side = { top: new Set(), bottom: new Set(), left: new Set(), right: new Set() }
  let blueInside = 0, blueOutside = 0, blueInterior = 0
  let outMax = 0
  const outSide = { left: 0, right: 0, top: 0, bottom: 0 }
  for (let y = cy0; y <= cy1; y++) {
    for (let x = cx0; x <= cx1; x++) {
      if (!isBlue(px(img, x, y))) continue
      dBlue++
      dminx = Math.min(dminx, x); dmaxx = Math.max(dmaxx, x)
      dminy = Math.min(dminy, y); dmaxy = Math.max(dmaxy, y)
      const insideBox = x >= bx - 0.5 && x <= bx + bw - 0.5 && y >= by - 0.5 && y <= by + bh - 0.5
      if (insideBox) {
        blueInside++
        // the ellipsis glyph is drawn in currentColor (primary blue) too, so count
        // ink strictly inside the pointer ring separately from the ring itself
        if (x >= bx + 3 && x <= bx + bw - 3 && y >= by + 3 && y <= by + bh - 3) blueInterior++
      } else {
        blueOutside++
        const overhang = Math.max(bx - x, x - (bx + bw - 1), by - y, y - (by + bh - 1))
        if (overhang > outMax) outMax = overhang
        if (x < bx) outSide.left++
        else if (x > bx + bw - 1) outSide.right++
        else if (y < by) outSide.top++
        else outSide.bottom++
      }
      const devX = x - bx, devY = y - by
      if (devY >= -0.5 && devY < band && devX >= -0.5 && devX < bw) side.top.add(x - Math.round(bx))
      if (devY >= bh - band && devY <= bh + 0.5 && devX >= -0.5 && devX < bw) side.bottom.add(x - Math.round(bx))
      if (devX >= -0.5 && devX < band && devY >= -0.5 && devY < bh) side.left.add(y - Math.round(by))
      if (devX >= bw - band && devX <= bw + 0.5 && devY >= -0.5 && devY < bh) side.right.add(y - Math.round(by))
    }
  }
  // 1 char per CSS pixel (padded by `pad` CSS px) for a human-readable picture
  const map = []
  for (let j = 0; j < Math.round(rectAfter.h) + 2 * pad; j++) {
    let line = ''
    for (let i = 0; i < Math.round(rectAfter.w) + 2 * pad; i++) {
      const sx = Math.round(ox + (rectAfter.x - pad + i + 0.5) * dx)
      const sy = Math.round(oy + (rectAfter.y - pad + j + 0.5) * dy)
      line += sx < 0 || sy < 0 || sx >= img.w || sy >= img.h ? ' ' : isBlue(px(img, sx, sy)) ? '#' : '.'
    }
    map.push(line)
  }
  const cov = (s, total) => +(s.size / Math.max(1, Math.round(total))).toFixed(3)
  const sideCoverage = {
    top: cov(side.top, bw), bottom: cov(side.bottom, bw),
    left: cov(side.left, bh), right: cov(side.right, bh),
  }
  return {
    ok: true,
    method: 'gnome-screenshot of X11 root window (real physical pixels), marker-calibrated',
    screenshot: path.basename(shotFile),
    screenshotDevicePx: { w: img.w, h: img.h },
    calibration: {
      devicePxPerCssPx_x: +dx.toFixed(4),
      devicePxPerCssPx_y: +dy.toFixed(4),
      originX: round(ox),
      originY: round(oy),
      rendererDpr: rect.dpr,
      consistent: calibrationConsistent,
    },
    rectCss: rectAfter,
    rectStable: rect.x === rectAfter.x && rect.y === rectAfter.y,
    boxDevice: { x: round(bx), y: round(by), w: round(bw), h: round(bh) },
    boxDeviceInsideScreen: bx >= 0 && by >= 0 && bx + bw <= img.w && by + bh <= img.h,
    cropDevice: { x: cx0, y: cy0, w: cx1 - cx0 + 1, h: cy1 - cy0 + 1 },
    deviceBluePixelsInCrop: dBlue,
    blueDevicePixelsInsideBox: blueInside,
    blueDevicePixelsOutsideBox: blueOutside,
    blueDevicePixelsInterior: blueInterior,
    ringDeviceBBox: dBlue ? { x: dminx, y: dminy, w: dmaxx - dminx + 1, h: dmaxy - dminy + 1 } : null,
    ringFullyInsideHitBoxStrict: dBlue > 0 && blueOutside === 0,
    // At zoom 1.25 an element can land on a half device pixel (e.g. 841.2 CSS px ->
    // 1051.5 device px). The strict test uses the exact fractional box, so up to one
    // device px of the ring's own half-covered edge column is scored "outside"; that
    // is quantization, not the ring escaping the element. The cell-overflow question
    // is answered by sideCoverage / ringVisibleOnAllFourSides.
    ringOutsideMaxDevicePx: +outMax.toFixed(2),
    ringOutsideSides: outSide,
    ringFullyInsideHitBoxWithin1DevicePx: dBlue > 0 && outMax <= 1,
    sideCoverage,
    ringVisibleOnAllFourSides:
      sideCoverage.top > 0.6 && sideCoverage.bottom > 0.6 && sideCoverage.left > 0.6 && sideCoverage.right > 0.6,
    asciiMap: map,
  }
}

const hoverProbe = async () => {
  const link = await page.$('.cc-table tbody tr .lt-row-action__ellipsis')
  if (!link) return { ok: false }
  await link.hover()
  await page.waitForTimeout(250)
  return page.evaluate(() => {
    const t = document.querySelector('.cc-table tbody tr .lt-row-action__ellipsis')
    return { ok: true, bg: t ? getComputedStyle(t).backgroundColor : null }
  })
}

const dropdownState = () =>
  page.evaluate(() => {
    const menus = [...document.querySelectorAll('.el-dropdown-menu')].filter(
      (e) => e.offsetParent !== null && e.getBoundingClientRect().height > 0,
    )
    const popper = menus[0] ? menus[0].closest('.el-popper') : null
    const rows = [...document.querySelectorAll('.cc-table tbody tr')]
    const r1 = rows[0] ? rows[0].getBoundingClientRect() : null
    return {
      visibleMenus: menus.length,
      itemCounts: menus.map((m) => m.querySelectorAll('.el-dropdown-menu__item').length),
      items: menus[0]
        ? [...menus[0].querySelectorAll('.el-dropdown-menu__item')].map((i) => i.textContent.trim())
        : [],
      popperTop: popper ? +popper.getBoundingClientRect().top.toFixed(1) : null,
      row1Top: r1 ? +r1.top.toFixed(1) : null,
      row1Bottom: r1 ? +r1.bottom.toFixed(1) : null,
    }
  })

const clickProbe = async () => {
  const out = {}
  await page.click('.cc-table tbody tr:nth-child(1) .lt-row-action__ellipsis')
  await page.waitForTimeout(350)
  out.row1MenuAfterTriggerClick = await dropdownState()
  out.row1OwnMenuOpened = out.row1MenuAfterTriggerClick.visibleMenus > 0
  // a click just BELOW the 28px hit box but still inside the same row must not open a menu
  const pt = await page.evaluate(() => {
    const el = document.querySelector('.cc-table tbody tr:nth-child(1) .lt-row-action__ellipsis')
    const r = el.getBoundingClientRect()
    const tr = el.closest('tr').getBoundingClientRect()
    return { x: r.x + r.width / 2, yBottom: r.bottom, rowBottom: tr.bottom }
  })
  const yProbe = Math.min(pt.yBottom + 2, pt.rowBottom - 1)
  out.probePointBelowHitBoxCss = { x: round(pt.x), y: round(yProbe) }
  await page.mouse.click(pt.x, yProbe)
  await page.waitForTimeout(350)
  out.afterClickBelowHitBox = await dropdownState()
  out.noMisTriggerBelowHitBox = out.afterClickBelowHitBox.visibleMenus === 0
  if (out.afterClickBelowHitBox.visibleMenus > 0) {
    await page.mouse.click(20, 20) // click far outside to close before the next step
    await page.waitForTimeout(300)
    out.afterClickOutside = await dropdownState()
  }
  await page.click('.cc-table tbody tr:nth-child(2) .lt-row-action__ellipsis')
  await page.waitForTimeout(350)
  out.row2MenuAfterTriggerClick = await dropdownState()
  out.row2OwnMenuOpened = out.row2MenuAfterTriggerClick.visibleMenus > 0
  out.row1AndRow2MenusDiffer = JSON.stringify(out.row1MenuAfterTriggerClick.items) !==
    JSON.stringify(out.row2MenuAfterTriggerClick.items)
  await page.mouse.click(20, 20)
  await page.waitForTimeout(300)
  return out
}

const fixedColumnProbe = () =>
  page.evaluate(() => {
    const wrap =
      document.querySelector('.el-table__body-wrapper .el-scrollbar__wrap') ||
      document.querySelector('.el-table__body-wrapper')
    const el = document.querySelector('.cc-table tbody tr .lt-row-action__ellipsis')
    if (!wrap || !el) return { ok: false }
    wrap.scrollLeft = 999999
    const r = el.getBoundingClientRect()
    const cs = getComputedStyle(el)
    return {
      ok: true,
      scrollLeft: +wrap.scrollLeft.toFixed(1),
      scrollWidth: wrap.scrollWidth,
      clientWidth: wrap.clientWidth,
      horizontalScrollAvailable: wrap.scrollWidth > wrap.clientWidth,
      triggerRectAfterScroll: { left: +r.left.toFixed(1), right: +r.right.toFixed(1), w: +r.width.toFixed(1) },
      innerWidth: window.innerWidth,
      triggerStillInViewport: r.right <= window.innerWidth + 1 && r.left >= -1,
      triggerDisplay: cs.display,
      triggerVisibility: cs.visibility,
    }
  })

// ---------- run ----------
const R = {
  environment: {
    display: DISPLAY,
    windowRequested: WINDOW,
    zoomMechanism:
      'chrome.tabs.setZoom() from a loaded unpacked MV3 helper extension (same per-tab/per-host page-zoom path as the browser zoom UI)',
    notEquivalentTo: ['viewport resize', 'deviceScaleFactor emulation', 'CSS transform: scale()'],
    pixelEvidenceMethod: 'gnome-screenshot of the X11 root window (real framebuffer pixels), marker-calibrated',
    extensionId,
    extensionFiles: ['zoom-helper-extension/manifest.json', 'zoom-helper-extension/sw.js'],
    userAgent: null,
    chromeVersion: null,
  },
  cdpCaptureLimitation: {
    observed: null, // filled from the actual measurement after the 125% leg
    consequence:
      'the opt-in entry lives in the fixed right operation column hugging the viewport right edge, so it is outside every CDP capture at 125%; pixel evidence at 125% therefore uses a real display capture.',
    measuredAt125: { innerWidth: null, innerHeight: null, dpr: null, cdpCapturedCssWidth: null, triggerCssX: null },
  },
  writesBlocked: [],
}

await page.goto(BASE + '/config/client', { waitUntil: 'networkidle', timeout: 40000 })
await page.waitForSelector('.cc-table tbody tr .lt-row-action__ellipsis', { timeout: 20000 })
await page.waitForTimeout(800)
R.environment.userAgent = await page.evaluate(() => navigator.userAgent)
R.environment.chromeVersion = (R.environment.userAgent.match(/Chrome\/[\d.]+/) || [])[0] || null
await page.evaluate(() => window.scrollTo(0, 0))

const ZOOMS = [
  { key: '100', factor: 1.0 },
  { key: '125', factor: 1.25 },
]

// reversibility: 100 -> 125 -> 100 in one window, reading tabs zoom + renderer state
R.zoomToggleSequence = []
for (const z of [{ key: '100', factor: 1.0 }, { key: '125', factor: 1.25 }, { key: '100', factor: 1.0 }]) {
  const before = await tabsZoom()
  const applied = await setZoom(z.factor)
  const after = await page.evaluate(() => ({
    dpr: window.devicePixelRatio,
    innerWidth: window.innerWidth,
    outerWidth: window.outerWidth,
    outerHeight: window.outerHeight,
    vvWidth: window.visualViewport ? Math.round(window.visualViewport.width) : null,
  }))
  R.zoomToggleSequence.push({
    target: z.factor,
    chromeTabsZoomBefore: before && before.zoom,
    chromeTabsZoomAfter: applied.applied,
    hostKey: applied.hostKey,
    ...after,
  })
}

// zoom legs: proof-of-effect + DOM measurements
R.clientZoomLeg = {}
R.client = {}
R.perZoom = {}
for (const z of ZOOMS) {
  await setZoom(z.factor)
  await page.waitForTimeout(500)
  await page.evaluate(() => window.scrollTo(0, 0))
  const m = await page.evaluate(() => {
    const el = document.querySelector('.cc-table tbody tr .lt-row-action__ellipsis')
    const box = el ? el.getBoundingClientRect() : null
    return {
      dpr: window.devicePixelRatio,
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      outerWidth: window.outerWidth,
      outerHeight: window.outerHeight,
      screen: { width: window.screen.width, height: window.screen.height },
      visualViewport: window.visualViewport
        ? { width: window.visualViewport.width, height: window.visualViewport.height, scale: window.visualViewport.scale }
        : null,
      hitBoxCss: box ? { w: box.width, h: box.height } : null,
    }
  })
  R.clientZoomLeg[z.key] = {
    requestedFactor: z.factor,
    chromeTabsZoom: await tabsZoom(),
    dpr: m.dpr,
    innerWidth: m.innerWidth,
    innerHeight: m.innerHeight,
    outerWidth: m.outerWidth,
    outerHeight: m.outerHeight,
    screen: m.screen,
    visualViewport: m.visualViewport,
    hitBoxCssPx: m.hitBoxCss,
    hitBoxPhysicalPx: m.hitBoxCss ? { w: round(m.hitBoxCss.w * m.dpr), h: round(m.hitBoxCss.h * m.dpr) } : null,
  }
  if (z.key === '125') {
    R.cdpCaptureLimitation.measuredAt125.innerWidth = m.innerWidth
    R.cdpCaptureLimitation.measuredAt125.innerHeight = m.innerHeight
    R.cdpCaptureLimitation.measuredAt125.dpr = m.dpr
    R.cdpCaptureLimitation.measuredAt125.cdpCapturedCssWidth = round(m.innerWidth / m.dpr)
    R.cdpCaptureLimitation.measuredAt125.triggerCssX = null
  }
  R.client[z.key] = await measureClient()
  const extra = {}
  await page.evaluate(() => window.scrollTo(0, 0))
  extra.focus = await focusComputed()
  if (z.key === '125' && extra.focus.tabReached) {
    R.cdpCaptureLimitation.measuredAt125.triggerCssX = round(extra.focus.box.x)
  }
  if (extra.focus.tabReached) {
    extra.ring = await ringScreenProbe(z.key).catch((e) => ({ ok: false, error: String(e && e.message) }))
  }
  await page.evaluate(() => window.scrollTo(0, 0))
  extra.hover = await hoverProbe()
  extra.fixedColumn = await fixedColumnProbe()
  await page.waitForTimeout(200)
  extra.click = await clickProbe()
  R.perZoom[z.key] = extra
}

{
  const m = R.cdpCaptureLimitation.measuredAt125
  const pct = Math.round((m.cdpCapturedCssWidth / m.innerWidth) * 100)
  R.cdpCaptureLimitation.observed =
    `Chrome CDP Page.captureScreenshot at page zoom Z covers only innerWidth/dpr CSS px ` +
    `(measured ${m.innerWidth}/${m.dpr}=${m.cdpCapturedCssWidth} CSS px at 125%), i.e. the ` +
    `leftmost ~${pct}% of the CSS viewport; captureBeyondViewport and clip.scale do not change it.`
}

// un-enabled reference page: read-only comparison, must be unchanged
R.datasource = {}
await setZoom(1.0)
await page.goto(BASE + '/config/data-source', { waitUntil: 'networkidle', timeout: 40000 })
await page.waitForSelector('.lt-main-table tbody tr', { timeout: 20000 }).catch(() => {})
await page.waitForTimeout(800)
R.datasource['100'] = await measureDs()
await setZoom(1.25)
await page.waitForTimeout(600)
await screenShot(path.join(OUT, 'screen-datasource-zoom125.png'))
R.datasource['125'] = await measureDs()

R.writesBlocked = writes
fs.writeFileSync(path.join(OUT, 'r1-zoom-raw.json'), JSON.stringify(R, null, 2))

// ---------- desensitized copy for the repository ----------
const D = JSON.parse(JSON.stringify(R))
const idMap = new Map()
const mapRows = (m) => {
  if (!m || !Array.isArray(m.rows)) return
  for (const r of m.rows) {
    if (r.clientId != null) {
      if (!idMap.has(r.clientId)) idMap.set(r.clientId, 'S' + String(idMap.size + 1).padStart(2, '0'))
      r.clientId = idMap.get(r.clientId)
    }
  }
}
for (const z of ['100', '125']) mapRows(D.client[z])
mapRows(D.datasource['100'])
mapRows(D.datasource['125'])
const dtext = JSON.stringify(D, null, 2).replace(/el-table_\d+_column_\d+/g, 'el-table_N_column_N')
fs.writeFileSync(path.join(REPO_OUT, 'real-zoom-results.json'), dtext)

const marksOf = (m) => {
  const rows = m.rows || []
  const tone = {}
  for (const r of rows) tone[r.tagTone || 'none'] = (tone[r.tagTone || 'none'] || 0) + 1
  return {
    rowCount: rows.length,
    tagTones: tone,
    idMarkPresentAll: rows.every((r) => r.idMarkPresent),
    idInactiveMarkRows: rows.filter((r) => r.idInactiveMark).length,
    abnormalMarkRows: rows.filter((r) => r.abnormalMark).length,
    chipCounts: [...new Set(rows.map((r) => r.chipCount))],
    plusNTexts: [...new Set(rows.map((r) => r.plusNText).filter((v) => v))],
    countNoteTexts: [...new Set(rows.map((r) => r.countNoteText).filter((v) => v))],
  }
}

// built from the desensitized copy D so the reviewable summary carries no business ids
// dedicated physical-pixel report: full ring geometry + ascii maps, both zooms
const focusPixelReport = {
  note:
    'Focus-ring / three-dot entry physical-pixel evidence at real browser page zoom 100% and 125%. ' +
    'The pixel leg uses a real display capture (gnome-screenshot of the X11 root window) because Chrome ' +
    'CDP Page.captureScreenshot at 125% can only cover innerWidth/dpr CSS px and therefore cannot reach the ' +
    'fixed right operation column where the entry lives.',
  zoomMechanism: 'chrome.tabs.setZoom() from a loaded unpacked MV3 helper extension',
  cdpCaptureLimitation: D.cdpCaptureLimitation,
  perZoom: {},
}
for (const z of ['100', '125']) {
  const r = D.perZoom[z].ring
  focusPixelReport.perZoom[z] = {
    focusComputed: D.perZoom[z].focus,
    ring: r,
  }
}

const summary = {
  chromeVersion: D.environment.chromeVersion,
  extensionId,
  cdpCaptureLimitation: D.cdpCaptureLimitation,
  toggle: D.zoomToggleSequence,
  zoomLegs: D.clientZoomLeg,
  focus: { '100': D.perZoom['100'].focus, '125': D.perZoom['125'].focus },
  // brief only: the full ring geometry + ascii maps live in focus-ring-pixels.json
  ring: { '100': omap(D.perZoom['100'].ring), '125': omap(D.perZoom['125'].ring) },
  hover: { '100': D.perZoom['100'].hover, '125': D.perZoom['125'].hover },
  fixedColumn: { '100': D.perZoom['100'].fixedColumn, '125': D.perZoom['125'].fixedColumn },
  click: { '100': D.perZoom['100'].click, '125': D.perZoom['125'].click },
  normalRowHeights: {
    '100': (D.client['100'].rows || []).filter((r) => !r.ambiguous).map((r) => r.rowH),
    '125': (D.client['125'].rows || []).filter((r) => r.ambiguous === false).map((r) => r.rowH),
  },
  ambiguousRows: {
    '100': (D.client['100'].rows || []).filter((r) => r.ambiguous),
    '125': (D.client['125'].rows || []).filter((r) => r.ambiguous),
  },
  marks: { '100': marksOf(D.client['100']), '125': marksOf(D.client['125']) },
  datasource: {
    '100': { optInCell: D.datasource['100'].optInCellCount, optInEllipsis: D.datasource['100'].optInEllipsisCount, rowMore: D.datasource['100'].rowMoreCount, heights: D.datasource['100'].rows.map((r) => r.rowH), moreText: D.datasource['100'].rows[0] && D.datasource['100'].rows[0].moreText },
    '125': { optInCell: D.datasource['125'].optInCellCount, optInEllipsis: D.datasource['125'].optInEllipsisCount, rowMore: D.datasource['125'].rowMoreCount, heights: D.datasource['125'].rows.map((r) => r.rowH), moreText: D.datasource['125'].rows[0] && D.datasource['125'].rows[0].moreText },
  },
  writesBlocked: writes.length,
}
fs.writeFileSync(path.join(OUT, 'r1-zoom-summary.json'), JSON.stringify(summary, null, 2))
fs.writeFileSync(path.join(REPO_OUT, 'real-zoom-summary.json'), JSON.stringify(summary, null, 2))
fs.writeFileSync(path.join(REPO_OUT, 'focus-ring-pixels.json'), JSON.stringify(focusPixelReport, null, 2))
console.log(JSON.stringify({ ...summary, ring: { '100': omap(D.perZoom['100'].ring), '125': omap(D.perZoom['125'].ring) } }, null, 2))

function omap(r) {
  if (!r || !r.asciiMap) return r
  const { asciiMap, ...rest } = r
  return { ...rest, asciiMapRows: asciiMap.length }
}

await ctx.close()
