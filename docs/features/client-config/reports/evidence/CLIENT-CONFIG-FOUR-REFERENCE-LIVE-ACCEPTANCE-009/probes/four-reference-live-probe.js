/**
 * CLIENT-CONFIG-FOUR-REFERENCE-LIVE-ACCEPTANCE-009
 * 只读对照探针：/config/client 与 /config/data-source，1440x900 / 1920x1080。
 *
 * 网络门禁在首次导航前安装：
 *  - 仅放行两页所需的只读 GET：/api/clients、/api/clients/data-source-options、/api/data-sources
 *    以及同源非 /api 静态资源；
 *  - 阻断所有业务非 GET（POST/PUT/DELETE 等）与越界 /api 请求；
 *  - 记录完整请求台账，forwardedNonGetBusiness 必须为 0。
 * 服务 worker 在 context 创建时禁用（serviceWorkers: 'block'）。
 *
 * 仅采集几何/计算样式/可见文本；不提交表单、不启停记录、不创建样本、不直连数据库。
 * 编辑弹窗仅打开验证入口后取消，不保存。
 */
'use strict'

const { chromium } = require('/root/.hermes/hermes-agent/node_modules/playwright-core')
const fs = require('node:fs')
const path = require('node:path')
const http = require('node:http')

const BASE = 'http://127.0.0.1:5173'
const EXE = '/root/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome'
const OUT = process.argv[2] || path.join(__dirname, '..')
const VIEWPORTS = [
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1920x1080', width: 1920, height: 1080 },
]
const READONLY_API_PATHS = new Set([
  '/api/clients',
  '/api/clients/data-source-options',
  '/api/data-sources',
])
const SAMPLE = {
  clientEnabled: 'probe-001',
  clientDisabled: 'hosp-008',
  clientLong: 'CCFG004-LONGID-0123456789ABCDEFG',
  clientAmbiguous: 'CCFG-AC-R1-HIST-COM',
  dsEnabled: '77711',
  dsInactive: 's-dssr1-0906-1',
  dsLong: '5905f1ce83024410836b40ca0ebfc446',
  dsSourceTag: 's-dssr1-0906-1',
  dsTargetTag: 's-dssr1-0906-4',
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true })
}
function saveJSON(file, obj) {
  fs.writeFileSync(file, JSON.stringify(obj, null, 2) + '\n', 'utf8')
}
function httpGetJSON(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { timeout: 15000 }, (res) => {
      let body = ''
      res.setEncoding('utf8')
      res.on('data', (c) => (body += c))
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, json: JSON.parse(body) })
        } catch (e) {
          reject(new Error(`invalid JSON from ${url}: ${e.message}`))
        }
      })
    })
    req.on('timeout', () => req.destroy(new Error('timeout')))
    req.on('error', reject)
  })
}

/* ---------------------------------------------------------------- contrast */

function parseColor(s) {
  if (!s) return null
  const m = s.match(/rgba?\(([^)]+)\)/)
  if (!m) return null
  const parts = m[1].split(',').map((x) => parseFloat(x.trim()))
  return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 }
}
function relLum({ r, g, b }) {
  const f = (v) => {
    v /= 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}
function contrastRatio(fg, bg) {
  const a = parseColor(fg)
  const b = parseColor(bg)
  if (!a || !b) return null
  const l1 = relLum(a)
  const l2 = relLum(b)
  const hi = Math.max(l1, l2)
  const lo = Math.min(l1, l2)
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100
}

/* ------------------------------------------------------- in-page helpers */

// 序列化后在页面上下文执行。
function pageCollectClient(args) {
  const round = (n) => Math.round(n * 100) / 100
  const rect = (el) => {
    if (!el) return null
    const r = el.getBoundingClientRect()
    return {
      x: round(r.x), y: round(r.y), left: round(r.left), top: round(r.top),
      right: round(r.right), bottom: round(r.bottom),
      width: round(r.width), height: round(r.height),
    }
  }
  const style = (el, props) => {
    if (!el) return null
    const c = getComputedStyle(el)
    const out = {}
    for (const p of props) out[p] = c.getPropertyValue(p)
    return out
  }
  const effectiveBg = (el) => {
    let e = el
    while (e) {
      const bg = getComputedStyle(e).backgroundColor
      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
        return { value: bg, sourceTag: e.tagName, sourceClass: String(e.className || '') }
      }
      e = e.parentElement
    }
    return { value: 'rgba(0, 0, 0, 0)', sourceTag: null, sourceClass: '' }
  }
  const rowByText = (rootSel, textSel, text) => {
    const rows = Array.from(document.querySelectorAll(`${rootSel} .el-table__row`))
    return rows.find((r) => {
      const t = r.querySelector(textSel)
      return t && t.textContent.trim() === text
    }) || null
  }
  const cells = (row) => Array.from(row.querySelectorAll(':scope > td'))
  const rectCenterY = (r) => (r ? r.top + r.height / 2 : null)
  const intersects = (a, b) => {
    if (!a || !b) return null
    return !(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top)
  }
  const headerLabels = (tableSel) =>
    Array.from(document.querySelectorAll(`${tableSel} .el-table__header th .cell`)).map((c) =>
      c.textContent.replace(/\s+/g, ' ').trim(),
    )

  const header = document.querySelector('.ql-result-panel__header')
  const summary = document.querySelector('.ql-result-panel__summary')
  const toolbar = document.querySelector('.ql-result-panel__toolbar')
  const addBtn = document.querySelector('.cc-btn-add')
  const addCount = document.querySelectorAll('.cc-btn-add').length
  const headerButtons = Array.from(header ? header.querySelectorAll('button') : [])
  const toolbarRect = rect(toolbar)
  const btnRect = rect(addBtn)
  const headerRect = rect(header)
  const gapCache = {}
  const gap = (a, b) => {
    if (!a || !b) return null
    return {
      buttonRightToToolbarRight: round(b.right - a.right),
      buttonRightToHeaderRight: round(headerRect.right - a.right),
      toolbarRightToHeaderRight: round(headerRect.right - b.right),
    }
  }
  gapCache.client079 = gap(btnRect, toolbarRect)

  const ac079 = {
    header: headerRect,
    summary: rect(summary),
    toolbar: toolbarRect,
    addButton: {
      text: addBtn ? addBtn.textContent.replace(/\s+/g, ' ').trim() : null,
      rect: btnRect,
      isToolbarLastElement: toolbar ? toolbar.lastElementChild === addBtn : null,
      countOnPage: addCount,
      countInsideHeader: headerButtons.filter((b) => b.classList.contains('cc-btn-add')).length,
      countInsideSummary: summary ? summary.querySelectorAll('.cc-btn-add').length : null,
      noButtonRightOfItInHeader: header
        ? Array.from(header.querySelectorAll('button')).every(
            (b) => b === addBtn || b.getBoundingClientRect().right <= addBtn.getBoundingClientRect().right + 0.5,
          )
        : null,
    },
    gaps: gapCache.client079,
    leftAreaHasAddButton: summary ? summary.querySelectorAll('.cc-btn-add').length > 0 : null,
  }

  // ---- 087
  const headers = headerLabels('.cc-table')
  const enabledRow = rowByText('.cc-table', '.cc-id', args.clientEnabled)
  const disabledRow = rowByText('.cc-table', '.cc-id', args.clientDisabled)
  const longRow = rowByText('.cc-table', '.cc-id', args.clientLong)
  const ambRow = rowByText('.cc-table', '.cc-id', args.clientAmbiguous)

  const describeIdCell = (row) => {
    if (!row) return null
    const cs = cells(row)
    const idCell = row.querySelector('.cc-col-id')
    const idText = row.querySelector('.cc-id')
    const inactive = row.querySelector('.cc-inactive-mark')
    const abnormal = row.querySelector('.cc-abnormal-mark')
    const opsCell = cs[cs.length - 1]
    const seqCell = row.querySelector('.cc-col-seq')
    const idRect = rect(idText)
    const markRect = rect(inactive || abnormal)
    const opsRect = rect(opsCell)
    const rowRect = rect(row)
    return {
      seqText: seqCell ? seqCell.textContent.trim() : null,
      seqCellRect: rect(seqCell),
      idCellRect: rect(idCell),
      idCellClass: idCell ? idCell.className : null,
      idRect,
      idText: idText ? idText.textContent : null,
      cellIndex: { seq: cs.indexOf(seqCell), id: cs.indexOf(idCell) },
      cellCount: cs.length,
      hasInactiveMark: !!inactive,
      hasAbnormalMark: !!abnormal,
      mark: inactive
        ? {
            kind: 'inactive',
            text: inactive.textContent.trim(),
            rect: markRect,
            style: style(inactive, [
              'display', 'align-items', 'justify-content', 'box-sizing',
              'height', 'line-height', 'padding', 'margin', 'border',
              'border-radius', 'background-color', 'color', 'font-size',
              'font-weight', 'font-family', 'vertical-align',
            ]),
            offsetFromIdRight: idRect ? round(markRect.left - idRect.right) : null,
            centerYDeltaFromId: idRect ? round(rectCenterY(markRect) - rectCenterY(idRect)) : null,
            cellContentCenterYDelta: idCell ? round(rectCenterY(markRect) - rectCenterY(rect(idCell))) : null,
            rowCenterYDelta: round(rectCenterY(markRect) - rectCenterY(rowRect)),
          }
        : abnormal
          ? {
              kind: 'abnormal',
              text: abnormal.textContent.trim(),
              rect: markRect,
              style: style(abnormal, [
                'display', 'align-items', 'justify-content', 'box-sizing',
                'height', 'line-height', 'padding', 'margin', 'border',
                'border-radius', 'background-color', 'color', 'font-size',
                'font-weight', 'font-family', 'vertical-align',
              ]),
            }
          : null,
      opsCellRect: opsRect,
      rowRect,
      markOverlapsOpsCell: intersects(markRect, opsRect),
      markRightWithinIdCell: markRect && idCell
        ? markRect.right <= rect(idCell).right + 0.5
        : null,
    }
  }

  const ac087 = {
    headers,
    seqIndex: headers.findIndex((h) => h === '序号'),
    idHeaderIndex: headers.findIndex((h) => h.includes('探针 ID')),
    idColumnFollowsSeq:
      headers.findIndex((h) => h === '序号') + 1 === headers.findIndex((h) => h.includes('探针 ID')),
    enabled: describeIdCell(enabledRow),
    disabled: describeIdCell(disabledRow),
    idsAlignedAcrossStates:
      enabledRow && disabledRow
        ? round(rect(enabledRow.querySelector('.cc-id')).left - rect(disabledRow.querySelector('.cc-id')).left)
        : null,
  }

  // ---- 091 ID 正文 + 三态（异常态样本缺失时显式记录）
  const bodyProps = [
    'color', 'font-weight', 'font-size', 'font-family', 'background-color',
    'overflow', 'text-overflow', 'white-space', 'line-height', 'letter-spacing',
  ]
  const describeBody = (row) => {
    if (!row) return null
    const idText = row.querySelector('.cc-id')
    const idCell = row.querySelector('.cc-col-id')
    const bg = effectiveBg(idCell)
    return {
      text: idText ? idText.textContent : null,
      rect: rect(idText),
      style: style(idText, bodyProps),
      cellStyle: style(idCell, ['background-color', 'padding', 'font-size', 'font-weight', 'color']),
      effectiveCellBackground: bg,
      clientWidth: idText ? idText.clientWidth : null,
      scrollWidth: idText ? idText.scrollWidth : null,
      truncated: idText ? idText.scrollWidth > idText.clientWidth + 1 : null,
    }
  }
  const ac091 = {
    enabled: describeBody(enabledRow),
    disabled: describeBody(disabledRow),
    abnormal: describeBody(
      Array.from(document.querySelectorAll('.cc-table .el-table__row')).find((r) =>
        r.querySelector('.cc-abnormal-mark'),
      ) || null,
    ),
    abnormalSamplePresent: !!document.querySelector('.cc-table .cc-abnormal-mark'),
    longId: describeBody(longRow),
    ambiguousRowPresent: !!ambRow,
    statesAvailableFromData: {
      on: !!enabledRow,
      off: !!disabledRow,
      abnormal: !!document.querySelector('.cc-table .cc-abnormal-mark'),
    },
  }

  // ---- 094 绿色标签（探针侧：无项级 anomalies 且整行无 COMMA_PROTOCOL_AMBIGUOUS 的样本）
  const tagRow = rowByText('.cc-table', '.cc-id', args.clientEnabled)
  const tag = tagRow ? tagRow.querySelector('.cc-dstag--ok') : null
  const tagTxt = tag ? tag.querySelector('.cc-txt') : null
  const tagRect = rect(tag)
  const txtRect = rect(tagTxt)
  const ac094 = {
    sampleRow: args.clientEnabled,
    rowHasRowbad: tagRow ? !!tagRow.querySelector('.cc-rowbad') : null,
    tag: tag
      ? {
          className: tag.className,
          text: tag.textContent.trim(),
          rect: tagRect,
          style: style(tag, [
            'display', 'align-items', 'justify-content', 'box-sizing',
            'height', 'line-height', 'padding', 'margin', 'border',
            'border-width', 'border-style', 'border-color', 'border-radius',
            'background-color', 'color', 'font-size', 'font-weight', 'font-family',
            'vertical-align', 'overflow', 'text-overflow', 'white-space',
          ]),
          clientWidth: tag.clientWidth,
          scrollWidth: tag.scrollWidth,
          clientHeight: tag.clientHeight,
          scrollHeight: tag.scrollHeight,
          clipped: tag.scrollWidth > tag.clientWidth + 1 || tag.scrollHeight > tag.clientHeight + 1,
          textBox: txtRect,
          textInsideTag:
            txtRect && tagRect
              ? txtRect.left >= tagRect.left - 0.5 &&
                txtRect.right <= tagRect.right + 0.5 &&
                txtRect.top >= tagRect.top - 0.5 &&
                txtRect.bottom <= tagRect.bottom + 0.5
              : null,
          gaps: txtRect && tagRect
            ? {
                left: round(txtRect.left - tagRect.left),
                right: round(tagRect.right - txtRect.right),
                top: round(txtRect.top - tagRect.top),
                bottom: round(tagRect.bottom - txtRect.bottom),
              }
            : null,
          horizontalCenterDelta: txtRect && tagRect
            ? round((txtRect.left + txtRect.width / 2) - (tagRect.left + tagRect.width / 2))
            : null,
          verticalCenterDelta: txtRect && tagRect
            ? round((txtRect.top + txtRect.height / 2) - (tagRect.top + tagRect.height / 2))
            : null,
        }
      : null,
    tagStateClassPresent: tag ? tag.className.includes('cc-dstag--ok') : null,
  }

  return { ac079, ac087, ac091, ac094 }
}

function pageCollectDataSource(args) {
  const round = (n) => Math.round(n * 100) / 100
  const rect = (el) => {
    if (!el) return null
    const r = el.getBoundingClientRect()
    return {
      x: round(r.x), y: round(r.y), left: round(r.left), top: round(r.top),
      right: round(r.right), bottom: round(r.bottom),
      width: round(r.width), height: round(r.height),
    }
  }
  const style = (el, props) => {
    if (!el) return null
    const c = getComputedStyle(el)
    const out = {}
    for (const p of props) out[p] = c.getPropertyValue(p)
    return out
  }
  const effectiveBg = (el) => {
    let e = el
    while (e) {
      const bg = getComputedStyle(e).backgroundColor
      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
        return { value: bg, sourceTag: e.tagName, sourceClass: String(e.className || '') }
      }
      e = e.parentElement
    }
    return { value: 'rgba(0, 0, 0, 0)', sourceTag: null, sourceClass: '' }
  }
  const rowByText = (text) => {
    const rows = Array.from(document.querySelectorAll('.data-table .el-table__row'))
    return rows.find((r) => {
      const t = r.querySelector('.ds-id-text')
      return t && t.textContent.trim() === text
    }) || null
  }
  const cells = (row) => Array.from(row.querySelectorAll(':scope > td'))
  const rectCenterY = (r) => (r ? r.top + r.height / 2 : null)
  const intersects = (a, b) => {
    if (!a || !b) return null
    return !(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top)
  }
  const headerLabels = () =>
    Array.from(document.querySelectorAll('.data-table .el-table__header th .cell')).map((c) =>
      c.textContent.replace(/\s+/g, ' ').trim(),
    )

  const header = document.querySelector('.ql-result-panel__header')
  const summary = document.querySelector('.ql-result-panel__summary')
  const toolbar = document.querySelector('.ql-result-panel__toolbar')
  const addBtn = document.querySelector('.ds-add-button')
  const headerRect = rect(header)
  const toolbarRect = rect(toolbar)
  const btnRect = rect(addBtn)
  const ac079 = {
    header: headerRect,
    summary: rect(summary),
    toolbar: toolbarRect,
    addButton: {
      text: addBtn ? addBtn.textContent.replace(/\s+/g, ' ').trim() : null,
      rect: btnRect,
      isToolbarLastElement: toolbar ? toolbar.lastElementChild === addBtn : null,
      countOnPage: document.querySelectorAll('.ds-add-button').length,
      countInsideHeader: header
        ? Array.from(header.querySelectorAll('button')).filter((b) => b.classList.contains('ds-add-button')).length
        : null,
      countInsideSummary: summary ? summary.querySelectorAll('.ds-add-button').length : null,
      noButtonRightOfItInHeader: header && addBtn
        ? Array.from(header.querySelectorAll('button')).every(
            (b) => b === addBtn || b.getBoundingClientRect().right <= addBtn.getBoundingClientRect().right + 0.5,
          )
        : null,
    },
    gaps: btnRect && toolbarRect
      ? {
          buttonRightToToolbarRight: round(toolbarRect.right - btnRect.right),
          buttonRightToHeaderRight: round(headerRect.right - btnRect.right),
          toolbarRightToHeaderRight: round(headerRect.right - toolbarRect.right),
        }
      : null,
    leftAreaHasAddButton: summary ? summary.querySelectorAll('.ds-add-button').length > 0 : null,
  }

  // ---- 087
  const headers = headerLabels()
  const enabledRow = rowByText(args.dsEnabled)
  const inactiveRow = rowByText(args.dsInactive)
  const longRow = rowByText(args.dsLong)
  const describeIdCell = (row) => {
    if (!row) return null
    const cs = cells(row)
    const idCell = row.querySelector('.ds-id-cell')
    const idText = row.querySelector('.ds-id-text')
    const inactive = row.querySelector('.ds-inactive-mark')
    const abnormal = row.querySelector('.ds-abnormal-mark')
    const opsCell = cs[cs.length - 1]
    const seqCell = cs[0]
    const idRect = rect(idText)
    const markRect = rect(inactive || abnormal)
    const opsRect = rect(opsCell)
    const rowRect = rect(row)
    return {
      seqText: seqCell ? seqCell.textContent.trim() : null,
      seqCellRect: rect(seqCell),
      idCellRect: rect(idCell),
      idRect,
      idText: idText ? idText.textContent : null,
      cellIndex: { seq: cs.indexOf(seqCell), id: cs.indexOf(idCell ? idCell.closest('td') : null) },
      cellCount: cs.length,
      hasInactiveMark: !!inactive,
      hasAbnormalMark: !!abnormal,
      mark: inactive
        ? {
            kind: 'inactive',
            text: inactive.textContent.trim(),
            rect: markRect,
            style: style(inactive, [
              'display', 'align-items', 'justify-content', 'box-sizing',
              'height', 'line-height', 'padding', 'margin', 'border',
              'border-radius', 'background-color', 'color', 'font-size',
              'font-weight', 'font-family', 'vertical-align',
            ]),
            offsetFromIdRight: idRect ? round(markRect.left - idRect.right) : null,
            centerYDeltaFromId: idRect ? round(rectCenterY(markRect) - rectCenterY(idRect)) : null,
            cellContentCenterYDelta: idCell ? round(rectCenterY(markRect) - rectCenterY(rect(idCell))) : null,
            rowCenterYDelta: round(rectCenterY(markRect) - rectCenterY(rowRect)),
          }
        : abnormal
          ? {
              kind: 'abnormal',
              text: abnormal.textContent.trim(),
              rect: markRect,
              style: style(abnormal, [
                'display', 'align-items', 'justify-content', 'box-sizing',
                'height', 'line-height', 'padding', 'margin', 'border',
                'border-radius', 'background-color', 'color', 'font-size',
                'font-weight', 'font-family', 'vertical-align',
              ]),
            }
          : null,
      opsCellRect: opsRect,
      rowRect,
      markOverlapsOpsCell: intersects(markRect, opsRect),
      markRightWithinIdCell: markRect && idCell
        ? markRect.right <= rect(idCell).right + 0.5
        : null,
    }
  }

  const ac087 = {
    headers,
    seqIndex: headers.findIndex((h) => h === '序号'),
    idHeaderIndex: headers.findIndex((h) => h.replace(/\s+/g, '').includes('数据源ID')),
    idColumnFollowsSeq:
      headers.findIndex((h) => h === '序号') + 1 ===
      headers.findIndex((h) => h.replace(/\s+/g, '').includes('数据源ID')),
    enabled: describeIdCell(enabledRow),
    disabled: describeIdCell(inactiveRow),
    idsAlignedAcrossStates:
      enabledRow && inactiveRow
        ? round(rect(enabledRow.querySelector('.ds-id-text')).left - rect(inactiveRow.querySelector('.ds-id-text')).left)
        : null,
  }

  // ---- 091 参考页 ID 正文
  const bodyProps = [
    'color', 'font-weight', 'font-size', 'font-family', 'background-color',
    'overflow', 'text-overflow', 'white-space', 'line-height', 'letter-spacing',
    'font-variant-numeric',
  ]
  const describeBody = (row) => {
    if (!row) return null
    const idText = row.querySelector('.ds-id-text')
    const idCell = row.querySelector('.ds-id-cell')
    return {
      text: idText ? idText.textContent : null,
      rect: rect(idText),
      style: style(idText, bodyProps),
      cellStyle: style(idCell, ['background-color', 'padding', 'font-size', 'font-weight', 'color']),
      effectiveCellBackground: effectiveBg(idCell),
      clientWidth: idText ? idText.clientWidth : null,
      scrollWidth: idText ? idText.scrollWidth : null,
      truncated: idText ? idText.scrollWidth > idText.clientWidth + 1 : null,
    }
  }
  const ac091 = {
    enabled: describeBody(enabledRow),
    inactive: describeBody(inactiveRow),
    longId: describeBody(longRow),
  }

  // ---- 094 参考页“角色”标签（源库=warning，目标库=success）
  const describeTag = (row) => {
    if (!row) return null
    const tag = row.querySelector('.el-tag')
    const tagRect = rect(tag)
    const txtRect = tag ? rect(tag.querySelector('span') || tag) : null
    return {
      text: tag ? tag.textContent.trim() : null,
      className: tag ? tag.className : null,
      rect: tagRect,
      style: style(tag, [
        'display', 'align-items', 'justify-content', 'box-sizing',
        'height', 'line-height', 'padding', 'margin', 'border',
        'border-width', 'border-style', 'border-color', 'border-radius',
        'background-color', 'color', 'font-size', 'font-weight', 'font-family',
        'vertical-align', 'overflow', 'text-overflow', 'white-space',
      ]),
      clientWidth: tag ? tag.clientWidth : null,
      scrollWidth: tag ? tag.scrollWidth : null,
      clientHeight: tag ? tag.clientHeight : null,
      scrollHeight: tag ? tag.scrollHeight : null,
      clipped: tag ? tag.scrollWidth > tag.clientWidth + 1 || tag.scrollHeight > tag.clientHeight + 1 : null,
      textBox: txtRect,
      textInsideTag:
        txtRect && tagRect
          ? txtRect.left >= tagRect.left - 0.5 &&
            txtRect.right <= tagRect.right + 0.5 &&
            txtRect.top >= tagRect.top - 0.5 &&
            txtRect.bottom <= tagRect.bottom + 0.5
          : null,
      gaps: txtRect && tagRect
        ? {
            left: round(txtRect.left - tagRect.left),
            right: round(tagRect.right - txtRect.right),
            top: round(txtRect.top - tagRect.top),
            bottom: round(tagRect.bottom - txtRect.bottom),
          }
        : null,
      horizontalCenterDelta: txtRect && tagRect
        ? round((txtRect.left + txtRect.width / 2) - (tagRect.left + tagRect.width / 2))
        : null,
      verticalCenterDelta: txtRect && tagRect
        ? round((txtRect.top + txtRect.height / 2) - (tagRect.top + tagRect.height / 2))
        : null,
    }
  }
  const ac094 = {
    sourceTagRow: args.dsSourceTag,
    targetTagRow: args.dsTargetTag,
    sourceTag: describeTag(rowByText(args.dsSourceTag)),
    targetTag: describeTag(rowByText(args.dsTargetTag)),
  }

  return { ac079, ac087, ac091, ac094 }
}

function collectEnv() {
  const round = (n) => Math.round(n * 100) / 100
  const sidebar = document.querySelector('.sidebar')
  const sr = sidebar ? sidebar.getBoundingClientRect() : null
  return {
    href: location.href,
    title: document.title,
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    outerWidth: window.outerWidth,
    outerHeight: window.outerHeight,
    devicePixelRatio: window.devicePixelRatio,
    visualViewportScale: window.visualViewport ? window.visualViewport.scale : null,
    fontsStatus: document.fonts ? document.fonts.status : null,
    bodyFontSize: getComputedStyle(document.body).fontSize,
    serviceWorkerControlled: !!(navigator.serviceWorker && navigator.serviceWorker.controller),
    sidebar: sidebar
      ? {
          collapsedClass: sidebar.classList.contains('collapsed'),
          width: round(sr.width),
          rect: { x: round(sr.x), y: round(sr.y), width: round(sr.width), height: round(sr.height) },
        }
      : null,
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    collectedAt: new Date().toISOString(),
  }
}

/* ----------------------------------------------------------------- main */

async function settle(page, rowSelector) {
  await page.waitForFunction((sel) => document.querySelectorAll(sel).length > 0, rowSelector, { timeout: 30000 })
  await page.evaluate(async () => {
    if (document.fonts && document.fonts.ready) await document.fonts.ready
  })
  await page.waitForTimeout(300)
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
}

async function hoverTip(page, locator) {
  await locator.scrollIntoViewIfNeeded()
  const box = await locator.boundingBox()
  if (!box) return { tipVisible: null, error: 'no-box' }
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.waitForTimeout(600)
  const tip = await page.evaluate(() => {
    const el = document.querySelector('.cc-single-tip')
    if (!el) return { exists: false }
    const c = getComputedStyle(el)
    const r = el.getBoundingClientRect()
    return {
      exists: true,
      visible: c.display !== 'none' && c.visibility !== 'hidden' && r.width > 0,
      text: el.textContent.trim(),
      rect: { x: r.x, y: r.y, width: r.width, height: r.height },
      role: el.getAttribute('role'),
    }
  })
  await page.mouse.move(2, 2)
  await page.waitForTimeout(150)
  return tip
}

async function openDialogAndCancel(page, via) {
  const dialog = page.locator('.el-dialog').filter({ hasText: '编辑探针' }).first()
  await dialog.waitFor({ state: 'visible', timeout: 10000 })
  await page.waitForTimeout(300)
  const info = await page.evaluate(() => {
    const d = document.querySelector('.el-dialog')
    const title = d ? d.querySelector('.el-dialog__title') : null
    const r = d ? d.getBoundingClientRect() : null
    return {
      visible: !!d,
      title: title ? title.textContent.trim() : null,
      rect: r ? { x: r.x, y: r.y, width: r.width, height: r.height } : null,
      postFormPresent: !!document.querySelector('.el-dialog form'),
    }
  })
  const cancel = page
    .locator('.el-dialog')
    .filter({ hasText: '编辑探针' })
    .locator('button')
    .filter({ hasText: '取消' })
    .first()
  await cancel.click()
  await dialog.waitFor({ state: 'hidden', timeout: 10000 })
  await page.waitForTimeout(200)
  return { via, ...info, closedWithoutSave: true }
}

async function runViewport(browser, vp) {
  const ledger = []
  const errors = []
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    screen: { width: vp.width, height: vp.height },
    deviceScaleFactor: 1,
    serviceWorkers: 'block',
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
  })
  const backendNonGetForwarded = { value: 0 }
  await context.route('**/*', async (route) => {
    const req = route.request()
    const url = new URL(req.url())
    const method = req.method()
    let allowed = false
    let reason = ''
    if (url.origin === BASE) {
      if (!url.pathname.startsWith('/api/')) {
        allowed = method === 'GET' || method === 'HEAD' || method === 'OPTIONS'
        reason = allowed ? 'static' : 'blocked-static-non-get'
      } else if (READONLY_API_PATHS.has(url.pathname)) {
        allowed = method === 'GET' || method === 'HEAD' || method === 'OPTIONS'
        reason = allowed ? 'readonly-api-get' : 'blocked-business-non-get'
      } else {
        allowed = false
        reason = 'blocked-out-of-scope-api'
      }
    } else {
      allowed = false
      reason = 'blocked-external'
    }
    ledger.push({
      method,
      url: req.url(),
      resourceType: req.resourceType(),
      allowed,
      reason,
    })
    if (allowed) {
      if (reason === 'readonly-api-get' && !['GET', 'HEAD', 'OPTIONS'].includes(method)) {
        backendNonGetForwarded.value += 1
      }
      await route.continue()
    } else {
      await route.abort('blockedbyclient')
    }
  })

  const page = await context.newPage()
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push({ type: 'console', text: msg.text() })
  })
  page.on('pageerror', (err) => errors.push({ type: 'pageerror', text: String(err && err.message) }))

  const out = { viewport: vp, browserVersion: browser.version(), ledger }

  // ---------- client page
  await page.goto(`${BASE}/config/client`, { waitUntil: 'domcontentloaded', timeout: 45000 })
  await settle(page, '.cc-table .el-table__row')
  await page.mouse.move(2, 2)
  await page.waitForTimeout(250)

  out.client = { env: await page.evaluate(collectEnv) }
  out.client.measurements = await page.evaluate(pageCollectClient, SAMPLE)

  // 091 long-ID tooltip (probe-side, live)
  const longIdEl = page.locator('.cc-id', { hasText: SAMPLE.clientLong }).first()
  out.client.longIdTooltip = await hoverTip(page, longIdEl)

  // 091 keyboard focus record (does not open dialog)
  out.client.keyboardFocus = await page.evaluate((id) => {
    const rows = Array.from(document.querySelectorAll('.cc-table .el-table__row'))
    const row = rows.find((r) => {
      const t = r.querySelector('.cc-id')
      return t && t.textContent.trim() === id
    })
    if (!row) return { found: false }
    const el = row.querySelector('.cc-id')
    el.focus()
    return {
      found: true,
      tabIndex: el.tabIndex,
      role: el.getAttribute('role'),
      ariaLabel: el.getAttribute('aria-label'),
      activeElementIsId: document.activeElement === el,
      outline: getComputedStyle(el).outline,
    }
  }, SAMPLE.clientEnabled)

  // screenshots before any row-click selection change
  await page.locator('.ql-result-panel__header').first().screenshot({
    path: path.join(OUT, 'screenshots', `client-079-header-${vp.name}.png`),
  })
  const enabledRowLoc = page
    .locator('.cc-table .el-table__row')
    .filter({ has: page.locator('.cc-id', { hasText: SAMPLE.clientEnabled }) })
    .first()
  const disabledRowLoc = page
    .locator('.cc-table .el-table__row')
    .filter({ has: page.locator('.cc-id', { hasText: SAMPLE.clientDisabled }) })
    .first()
  await enabledRowLoc.locator('.cc-col-id').screenshot({
    path: path.join(OUT, 'screenshots', `client-091-enabled-id-${vp.name}.png`),
  })
  await disabledRowLoc.locator('.cc-col-id').screenshot({
    path: path.join(OUT, 'screenshots', `client-087-091-disabled-id-${vp.name}.png`),
  })
  await enabledRowLoc.locator('.cc-dstag--ok').first().screenshot({
    path: path.join(OUT, 'screenshots', `client-094-green-tag-${vp.name}.png`),
  })

  // 091 edit entries: mouse double-click row description, then keyboard Enter on ID
  await enabledRowLoc.scrollIntoViewIfNeeded()
  await enabledRowLoc.locator('.cc-desc').first().dblclick()
  out.client.mouseEditEntry = await openDialogAndCancel(page, 'row-dblclick-desc')
  await page.mouse.move(2, 2)

  await enabledRowLoc.locator('.cc-id').dblclick()
  out.client.idDblClickEditEntry = await openDialogAndCancel(page, 'id-dblclick')
  await page.mouse.move(2, 2)

  await enabledRowLoc.locator('.cc-id').focus()
  await page.keyboard.press('Enter')
  out.client.keyboardEditEntry = await openDialogAndCancel(page, 'id-focus-enter')
  await page.mouse.move(2, 2)

  // ---------- data-source reference page
  await page.goto(`${BASE}/config/data-source`, { waitUntil: 'domcontentloaded', timeout: 45000 })
  await settle(page, '.data-table .el-table__row')
  await page.mouse.move(2, 2)
  await page.waitForTimeout(250)

  out.dataSource = { env: await page.evaluate(collectEnv) }
  out.dataSource.measurements = await page.evaluate(pageCollectDataSource, SAMPLE)

  await page.locator('.ql-result-panel__header').first().screenshot({
    path: path.join(OUT, 'screenshots', `ds-079-header-${vp.name}.png`),
  })
  const dsInactiveRowLoc = page
    .locator('.data-table .el-table__row')
    .filter({ has: page.locator('.ds-id-text', { hasText: SAMPLE.dsInactive }) })
    .first()
  const dsSourceRowLoc = page
    .locator('.data-table .el-table__row')
    .filter({ has: page.locator('.ds-id-text', { hasText: SAMPLE.dsSourceTag }) })
    .first()
  const dsTargetRowLoc = page
    .locator('.data-table .el-table__row')
    .filter({ has: page.locator('.ds-id-text', { hasText: SAMPLE.dsTargetTag }) })
    .first()
  await dsInactiveRowLoc.locator('.ds-id-cell').screenshot({
    path: path.join(OUT, 'screenshots', `ds-087-091-inactive-id-${vp.name}.png`),
  })
  await dsSourceRowLoc.locator('.el-tag').first().screenshot({
    path: path.join(OUT, 'screenshots', `ds-094-source-tag-${vp.name}.png`),
  })
  await dsTargetRowLoc.locator('.el-tag').first().screenshot({
    path: path.join(OUT, 'screenshots', `ds-094-target-tag-${vp.name}.png`),
  })

  out.backendNonGetForwarded = backendNonGetForwarded.value
  out.errors = errors
  out.finishedAt = new Date().toISOString()
  await context.close()
  return out
}

;(async () => {
  ensureDir(OUT)
  ensureDir(path.join(OUT, 'raw'))
  ensureDir(path.join(OUT, 'network'))
  ensureDir(path.join(OUT, 'screenshots'))
  ensureDir(path.join(OUT, 'samples'))

  // 脱敏样本依据：直接只读 GET（非浏览器），仅保留判定所需字段
  const sampleBasis = { collectedAt: new Date().toISOString(), endpoints: {} }
  try {
    const clients = await httpGetJSON('http://127.0.0.1:8080/api/clients?status=ALL')
    const items = clients.json.data.items
    const pick = (id) => {
      const r = items.find((x) => x.clientId === id)
      if (!r) return null
      return {
        clientId: r.clientId,
        status: r.status,
        fgActive: r.fgActive,
        rowAnomalies: r.rowAnomalies,
        possibleCommaDataSourceIds: r.possibleCommaDataSourceIds,
        dataSources: r.dataSources.map((d) => ({
          dataSourceId: d.dataSourceId,
          org: d.org,
          anomalies: d.anomalies,
        })),
      }
    }
    sampleBasis.endpoints.clients = {
      status: clients.status,
      total: items.length,
      fgActiveValues: Array.from(new Set(items.map((x) => String(x.fgActive)))),
      samples: {
        enabled: pick(SAMPLE.clientEnabled),
        disabled: pick(SAMPLE.clientDisabled),
        long: pick(SAMPLE.clientLong),
        ambiguous: pick(SAMPLE.clientAmbiguous),
      },
    }
    const ds = await httpGetJSON('http://127.0.0.1:8080/api/data-sources?status=ALL')
    const rows = ds.json.data
    const pickDs = (id) => {
      const r = rows.find((x) => x.dataSourceId === id)
      if (!r) return null
      return {
        dataSourceId: r.dataSourceId,
        dataSourceName: r.dataSourceName,
        dataSourceCategory: r.dataSourceCategory,
        dataSourceType: r.dataSourceType,
        fgActive: r.fgActive,
      }
    }
    sampleBasis.endpoints.dataSources = {
      status: ds.status,
      total: rows.length,
      fgActiveValues: Array.from(new Set(rows.map((x) => String(x.fgActive)))),
      samples: {
        enabled: pickDs(SAMPLE.dsEnabled),
        inactive: pickDs(SAMPLE.dsInactive),
        long: pickDs(SAMPLE.dsLong),
        sourceTag: pickDs(SAMPLE.dsSourceTag),
        targetTag: pickDs(SAMPLE.dsTargetTag),
      },
    }
  } catch (e) {
    sampleBasis.error = String(e && e.message)
  }
  saveJSON(path.join(OUT, 'samples', 'sample-basis.json'), sampleBasis)

  const browser = await chromium.launch({
    executablePath: EXE,
    headless: true,
    args: ['--no-sandbox', '--force-device-scale-factor=1', '--disable-lcd-text'],
  })
  const runMeta = {
    task: 'CLIENT-CONFIG-FOUR-REFERENCE-LIVE-ACCEPTANCE-009',
    startedAt: new Date().toISOString(),
    baseUrl: BASE,
    browserVersion: browser.version(),
    executable: EXE,
    serviceWorkers: 'block',
    allowlistedReadOnlyApis: Array.from(READONLY_API_PATHS),
    viewports: VIEWPORTS,
    samples: SAMPLE,
  }
  saveJSON(path.join(OUT, 'network', 'run-meta.json'), runMeta)

  for (const vp of VIEWPORTS) {
    const result = await runViewport(browser, vp)
    saveJSON(path.join(OUT, 'raw', `client-and-ds-${vp.name}.json`), result)
    saveJSON(path.join(OUT, 'network', `ledger-${vp.name}.json`), {
      viewport: vp,
      browserVersion: result.browserVersion,
      entries: result.ledger,
      backendNonGetForwarded: result.backendNonGetForwarded,
      blockedCount: result.ledger.filter((e) => !e.allowed).length,
      allowedCount: result.ledger.filter((e) => e.allowed).length,
    })
    console.log(
      `${vp.name}: entries=${result.ledger.length} blocked=${result.ledger.filter((e) => !e.allowed).length} nonGetForwarded=${result.backendNonGetForwarded} errors=${result.errors.length}`,
    )
  }

  await browser.close()
  saveJSON(path.join(OUT, 'network', 'run-summary.json'), {
    ...runMeta,
    finishedAt: new Date().toISOString(),
  })
  console.log('done')
})().catch((e) => {
  console.error('PROBE FAILED:', e && e.stack ? e.stack : e)
  process.exit(1)
})
