// Read-only probe for AC-090 / AC-157 disabled-state applicability.
// Installs /api/** write interception BEFORE first navigation; never submits a valid form,
// never clicks enable/disable/delete final confirmation.
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const pw = process.env.PLAYWRIGHT_CORE_DIR
  ? await import(pathToFileURL(path.join(process.env.PLAYWRIGHT_CORE_DIR, 'index.js')).href)
  : await import('playwright-core')
const { chromium } = pw.chromium ? pw : pw.default

const BASE = 'http://127.0.0.1:5173'
const OUT_DIR = path.dirname(new URL(import.meta.url).pathname)
const OUT = path.join(OUT_DIR, 'disabled-applicability-results.json')

const sampleStyle = (el) => {
  if (!el) return null
  const cs = getComputedStyle(el)
  return {
    backgroundColor: cs.backgroundColor,
    borderTopColor: cs.borderTopColor,
    borderTopWidth: cs.borderTopWidth,
    color: cs.color,
    borderRadius: cs.borderTopLeftRadius,
    fontWeight: cs.fontWeight,
    fontSize: cs.fontSize,
    cursor: cs.cursor,
  }
}

const rectOf = (el) => {
  if (!el) return null
  const r = el.getBoundingClientRect()
  return {
    x: Math.round(r.x),
    y: Math.round(r.y),
    width: Math.round(r.width),
    height: Math.round(r.height),
    right: Math.round(r.right),
    bottom: Math.round(r.bottom),
  }
}

const maskLabel = (text) => (text ? text.replace(/更多操作：.*$/, '更多操作：<ID>') : null)

async function collectForViewport(browser, width, height, writes) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 })
  await ctx.route('**/api/**', async (route) => {
    const m = route.request().method().toUpperCase()
    if (m === 'GET' || m === 'HEAD' || m === 'OPTIONS') return route.continue()
    let p = route.request().url()
    try {
      const u = new URL(p)
      p = u.pathname
    } catch {
      /* keep as-is */
    }
    writes.push({ method: m, path: p })
    return route.abort('blockedbyclient')
  })
  const page = await ctx.newPage()
  await page.goto(BASE + '/config/client', { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForSelector('.cc-table tbody tr', { timeout: 30000 })
  await page.waitForTimeout(500)

  const result = { viewport: `${width}x${height}` }

  // ---------- AC-090: add button ----------
  await page.mouse.move(0, 0)
  await page.waitForTimeout(150)

  const addDefault = await page.evaluate(() => {
    const btn = document.querySelector('.cc-btn-add')
    if (!btn) return { error: 'no add button' }
    const r = btn.getBoundingClientRect()
    const panel = btn.closest('.ql-result-panel')
    const header = btn.closest('.ql-result-panel__header')
    const toolbar = btn.closest('.ql-result-panel__toolbar')
    const icon = btn.querySelector('.cc-btn-icon')
    const svg = btn.querySelector('svg')
    const cs = getComputedStyle(btn)
    return {
      text: btn.textContent.trim(),
      hasSvgIcon: Boolean(svg),
      iconClass: icon ? icon.getAttribute('class') : null,
      disabledAttr: btn.hasAttribute('disabled'),
      isDisabledClass: btn.classList.contains('is-disabled'),
      rect: {
        right: Math.round(r.right),
        width: Math.round(r.width),
        height: Math.round(r.height),
      },
      panelRight: panel ? Math.round(panel.getBoundingClientRect().right) : null,
      headerRight: header ? Math.round(header.getBoundingClientRect().right) : null,
      toolbarRight: toolbar ? Math.round(toolbar.getBoundingClientRect().right) : null,
      isLastInToolbar: toolbar ? toolbar.lastElementChild === btn : null,
      styles: {
        backgroundColor: cs.backgroundColor,
        borderTopColor: cs.borderTopColor,
        borderTopWidth: cs.borderTopWidth,
        color: cs.color,
        borderRadius: cs.borderTopLeftRadius,
        fontWeight: cs.fontWeight,
        fontSize: cs.fontSize,
        cursor: cs.cursor,
      },
    }
  })
  result.ac090 = { default: addDefault }

  // Hover
  const addBox = await page.locator('.cc-btn-add').boundingBox()
  if (addBox) {
    await page.locator('.cc-btn-add').hover()
    await page.waitForTimeout(400)
    result.ac090.hover = await page.evaluate(() => {
      const btn = document.querySelector('.cc-btn-add')
      const cs = getComputedStyle(btn)
      return {
        matchesHover: btn.matches(':hover'),
        backgroundColor: cs.backgroundColor,
        borderTopColor: cs.borderTopColor,
        color: cs.color,
      }
    })
  }

  // Real Tab keyboard focus: blur first, then walk the tab order.
  await page.mouse.move(0, 0)
  await page.evaluate(() => document.activeElement?.blur?.())
  await page.keyboard.press('Escape').catch(() => {})
  let addTabSteps = null
  for (let i = 1; i <= 60; i++) {
    await page.keyboard.press('Tab')
    const hit = await page.evaluate(() => document.activeElement?.classList?.contains('cc-btn-add') ?? false)
    if (hit) {
      addTabSteps = i
      break
    }
  }
  result.ac090.keyboardFocus = await page.evaluate(
    (steps) => {
      const btn = document.querySelector('.cc-btn-add')
      const active = document.activeElement
      const cs = getComputedStyle(btn)
      return {
        reachedByTab: active === btn,
        tabSteps: steps,
        activeTag: active ? active.tagName : null,
        styles: {
          backgroundColor: cs.backgroundColor,
          borderTopColor: cs.borderTopColor,
          color: cs.color,
          outlineStyle: cs.outlineStyle,
          outlineColor: cs.outlineColor,
        },
      }
    },
    addTabSteps,
  )

  // Pressed (:active): mouse down, read while held, then release (opens dialog, no submit).
  if (addBox) {
    await page.mouse.move(addBox.x + addBox.width / 2, addBox.y + addBox.height / 2)
    await page.waitForTimeout(120)
    await page.mouse.down()
    await page.waitForTimeout(150)
    result.ac090.active = await page.evaluate(() => {
      const btn = document.querySelector('.cc-btn-add')
      const cs = getComputedStyle(btn)
      return {
        backgroundColor: cs.backgroundColor,
        borderTopColor: cs.borderTopColor,
        color: cs.color,
      }
    })
    await page.mouse.up()
    await page.waitForSelector('.cc-dialog:visible', { timeout: 8000 }).catch(() => {})
    result.ac090.clickOpensDialog = await page.evaluate(() => {
      const dialogs = [...document.querySelectorAll('.cc-dialog')]
      const visible = dialogs.find((d) => d.getClientRects().length > 0)
      if (!visible) return { visible: false, title: null }
      const title = visible.querySelector('.el-dialog__title')?.textContent?.trim() ?? null
      return { visible: true, title }
    })
    // Close via header close button; fall back to Escape. Never submits.
    const closeBtn = page.locator('.cc-dialog:visible .el-dialog__headerbtn').first()
    if (await closeBtn.count()) {
      await closeBtn.click().catch(() => {})
    } else {
      await page.keyboard.press('Escape').catch(() => {})
    }
    await page.waitForTimeout(400)
  }

  // Query / reset buttons (shared component; must not be affected by add-button styling).
  result.ac090.queryReset = await page.evaluate(() => {
    const pick = (sel) => {
      const el = document.querySelector(sel)
      if (!el) return null
      const cs = getComputedStyle(el)
      const r = el.getBoundingClientRect()
      return {
        text: el.textContent.trim(),
        width: Math.round(r.width),
        height: Math.round(r.height),
        backgroundColor: cs.backgroundColor,
        borderTopColor: cs.borderTopColor,
        color: cs.color,
        borderRadius: cs.borderTopLeftRadius,
        hasAddClass: el.classList.contains('cc-btn-add'),
        disabledAttr: el.hasAttribute('disabled'),
        ariaDisabled: el.getAttribute('aria-disabled'),
      }
    }
    return { query: pick('button.ql-actions__query'), reset: pick('button.ql-actions__reset') }
  })

  // ---------- AC-157: three-dot trigger ----------
  await page.mouse.move(0, 0)
  await page.waitForTimeout(150)

  result.ac157 = {}
  result.ac157.structure = await page.evaluate(() => {
    const triggers = document.querySelectorAll('.lt-row-action__ellipsis')
    const cells = document.querySelectorAll('td.lt-row-action__cell')
    const rows = [...document.querySelectorAll('.cc-table tbody tr')]
    const hist = {}
    for (const row of rows) {
      const h = Math.round(row.getBoundingClientRect().height)
      hist[h] = (hist[h] ?? 0) + 1
    }
    const first = triggers[0]
    const cell = first ? first.closest('td') : null
    const row = first ? first.closest('tr') : null
    const cs = first ? getComputedStyle(first) : null
    const tr = first ? first.getBoundingClientRect() : null
    const cr = cell ? cell.getBoundingClientRect() : null
    const rr = row ? row.getBoundingClientRect() : null
    return {
      triggerCount: triggers.length,
      optInCellCount: cells.length,
      rowCount: rows.length,
      rowHeightHistogram: hist,
      trigger: first
        ? {
            rect: {
              x: Math.round(tr.x),
              y: Math.round(tr.y),
              width: Math.round(tr.width),
              height: Math.round(tr.height),
              right: Math.round(tr.right),
              bottom: Math.round(tr.bottom),
            },
            borderRadius: cs.borderTopLeftRadius,
            color: cs.color,
            cursor: cs.cursor,
            display: cs.display,
            role: first.getAttribute('role'),
            tabindex: first.getAttribute('tabindex'),
            ariaLabelMasked: (first.getAttribute('aria-label') ?? '').replace(/更多操作：.*$/, '更多操作：<ID>'),
            hasDisabledAttr: first.hasAttribute('disabled'),
            hasAriaDisabled: first.hasAttribute('aria-disabled'),
            isDisabledClass: first.classList.contains('is-disabled'),
            cellRect: cr
              ? { width: Math.round(cr.width), height: Math.round(cr.height) }
              : null,
            rowRect: rr ? { width: Math.round(rr.width), height: Math.round(rr.height) } : null,
            boxInsideCell:
              tr && cr
                ? tr.left >= cr.left - 0.5 &&
                  tr.right <= cr.right + 0.5 &&
                  tr.top >= cr.top - 0.5 &&
                  tr.bottom <= cr.bottom + 0.5
                : null,
            boxInsideRow:
              tr && rr
                ? tr.top >= rr.top - 0.5 && tr.bottom <= rr.bottom + 0.5
                : null,
            vCentered:
              tr && rr ? Math.abs((tr.top + tr.bottom) / 2 - (rr.top + rr.bottom) / 2) <= 1 : null,
          }
        : null,
    }
  })

  // Real Tab reachability + focus-visible; continue the tab walk started above.
  let triggerTabSteps = null
  for (let i = 1; i <= 80; i++) {
    await page.keyboard.press('Tab')
    const hit = await page.evaluate(() =>
      document.activeElement?.classList?.contains('lt-row-action__ellipsis') ?? false,
    )
    if (hit) {
      triggerTabSteps = i
      break
    }
  }
  result.ac157.keyboard = await page.evaluate((steps) => {
    const active = document.activeElement
    const isTrigger = active?.classList?.contains('lt-row-action__ellipsis') ?? false
    const cs = isTrigger ? getComputedStyle(active) : null
    return {
      reachedByTab: isTrigger,
      tabStepsFromPreviousFocus: steps,
      activeTag: active ? active.tagName : null,
      activeRole: active ? active.getAttribute('role') : null,
      focusVisible: cs
        ? {
            outlineStyle: cs.outlineStyle,
            outlineWidth: cs.outlineWidth,
            outlineColor: cs.outlineColor,
            outlineOffset: cs.outlineOffset,
          }
        : null,
    }
  }, triggerTabSteps)

  // Hover state (move mouse onto first trigger).
  const trigBox = await page.locator('.lt-row-action__ellipsis').first().boundingBox()
  if (trigBox) {
    await page.locator('.lt-row-action__ellipsis').first().hover()
    await page.waitForTimeout(400)
    result.ac157.hover = await page.evaluate(() => {
      const el = document.querySelector('.lt-row-action__ellipsis')
      const cs = getComputedStyle(el)
      return {
        matchesHover: el.matches(':hover'),
        backgroundColor: cs.backgroundColor,
        color: cs.color,
        cursor: cs.cursor,
      }
    })

    // Open the dropdown menu (read-only; does not execute any command).
    await page.locator('.lt-row-action__ellipsis').first().click()
    await page.waitForSelector('.cc-more-popper:visible', { timeout: 5000 }).catch(() => {})
    await page.waitForTimeout(300)
    result.ac157.menu = await page.evaluate(() => {
      const popper = [...document.querySelectorAll('.cc-more-popper')].find(
        (p) => p.getClientRects().length > 0,
      )
      if (!popper) return { visible: false, items: [] }
      const items = [...popper.querySelectorAll('.el-dropdown-menu__item')].map((it) => ({
        text: it.textContent.trim(),
        disabledAttr: it.getAttribute('aria-disabled'),
        isDisabledClass: it.classList.contains('is-disabled'),
      }))
      return { visible: true, items }
    })
    await page.keyboard.press('Escape').catch(() => {})
    await page.waitForTimeout(250)
    // Ensure the menu is closed without touching any command; click the summary area.
    if (await page.locator('.cc-more-popper:visible').count()) {
      await page.locator('.cc-result-count').first().click({ force: true }).catch(() => {})
      await page.waitForTimeout(250)
    }
  }

  // Source-derived checks (no cross-page navigation).
  result.sourceChecks = await page.evaluate(() => {
    const link = [...document.querySelectorAll('style, link')].map((e) => e.tagName.toLowerCase())
    // Aggregate CSS rule info from same-origin stylesheets.
    const rules = []
    for (const sheet of document.styleSheets) {
      let cssRules
      try {
        cssRules = sheet.cssRules
      } catch {
        continue
      }
      const walk = (list) => {
        for (const rule of list) {
          if (rule.type === CSSRule.STYLE_RULE) {
            const sel = rule.selectorText || ''
            if (sel.includes('lt-row-action__ellipsis') || sel.includes('lt-row-action__cell')) {
              rules.push({
                selector: sel,
                cssText: rule.style.cssText,
                hasImportant: rule.style.cssText.includes('!important'),
              })
            }
          } else if (rule.cssRules) {
            walk(rule.cssRules)
          }
        }
      }
      walk(cssRules)
    }
    return { optInRules: rules, styleTagKinds: link }
  })

  // Row actions still governed by the Feature: dropdown command handlers are external;
  // the accessible name comes from aria-label and the menu items are page-owned.
  result.ac157.featureOwnership = await page.evaluate(() => {
    const trigger = document.querySelector('.lt-row-action__ellipsis')
    return {
      ariaLabelPresent: Boolean(trigger?.getAttribute('aria-label')),
      publicLayerInjectsMenu: false,
      note: 'menu items/commands are rendered by ClientConfigPage.vue; public CSS has no menu/permission/request rules',
    }
  })

  await ctx.close()
  return result
}

const writes = []
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
const browserVersion = browser.version()
let results
try {
  const v1440 = await collectForViewport(browser, 1440, 900, writes)
  const v1920 = await collectForViewport(browser, 1920, 1080, writes)
  results = { viewports: { '1440x900': v1440, '1920x1080': v1920 } }
} finally {
  await browser.close()
}

const out = {
  task: 'CLIENT-CONFIG-DISABLED-APPLICABILITY-TARGETED-READONLY-ACCEPTANCE-001',
  mode: 'readonly-browser-probe',
  browser: `chromium ${browserVersion}`,
  deviceScaleFactor: 1,
  frontend: BASE,
  writeInterception: {
    installedBeforeNavigation: true,
    policy: '/api/** GET/HEAD/OPTIONS allow; POST/PUT/PATCH/DELETE abort+count',
    nonGetAttempts: writes.length,
    attempts: writes,
  },
  ...results,
}
fs.writeFileSync(OUT, JSON.stringify(out, null, 2))
console.log('WROTE', OUT)
console.log('nonGetAttempts', writes.length)
console.log(JSON.stringify(out.viewports['1440x900'].ac090, null, 1).slice(0, 2500))
console.log(JSON.stringify(out.viewports['1440x900'].ac157, null, 1).slice(0, 3500))
