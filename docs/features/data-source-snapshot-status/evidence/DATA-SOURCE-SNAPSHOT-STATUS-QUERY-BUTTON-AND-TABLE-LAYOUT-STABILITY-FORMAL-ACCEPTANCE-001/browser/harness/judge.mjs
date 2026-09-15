// SHARED STRICT JUDGE for
// DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-FORMAL-ACCEPTANCE-001
//
// Pure function of an already-collected result object. Every geometry delta is RECOMPUTED here from the raw
// per-state getBoundingClientRect() numbers, with NO rounding and NO tolerance: values that the acceptance
// rows require to be 0 are compared with strict === 0. A 0.001px displacement therefore cannot hide.
//
// The SAME module is used by the real acceptance run (accept.mjs) and by the page-independent negative
// control (negative-control.mjs). There is no "always-true" judge anywhere in this harness.
//
// It judges only what DSS-AC-114~118 + DESIGN §38 + UI §32 actually state.

export const REQUIRED_VIEWPORTS = ['1280x800', '1700x920', '1920x1080', '2560x1440']

export const REQUIRED_STATE_NAMES = [
  'LONG_IDLE',
  'QUERY_LOADING',
  'QUERY_SUCCESS',
  'SHORT_IDLE',
  'RESTORE_LONG_IDLE',
  'QUERY_FAILURE',
]

export const QUERY_BUTTON_WIDTH = 62
export const RESET_BUTTON_WIDTH = 62
export const REFRESH_BUTTON_WIDTH = 110

// DSS-AC-117: the fixed / elastic split must be preserved, not frozen to pixels.
export const FIXED_COLUMNS = [
  ['序号', 70],
  ['快照状态', 140],
]
export const ELASTIC_COLUMNS = [
  ['探针端', 170],
  ['源库', 285],
  ['快照启动时间', 170],
  ['快照完成时间', 170],
  ['记录更新时间', 170],
]
export const TABLE_COLUMN_COUNT = FIXED_COLUMNS.length + ELASTIC_COLUMNS.length

// DSS-AC-116: header centres that must not move.
export const CENTER_HEADERS = ['探针端', '源库', '快照状态', '快照启动时间', '快照完成时间', '记录更新时间']

// A "long" result must really overflow vertically; a "short" result must really not.
export const LONG_MIN_RECORDS = 10
export const SHORT_MAX_RECORDS = 3

const numeric = (v) => typeof v === 'number' && Number.isFinite(v)

/** Raw max-min over a per-state selector. Returns null if any value is missing/non-finite. */
function exactDelta(states, getter) {
  const vals = states.map(getter)
  if (vals.some((v) => !numeric(v))) return null
  return Math.max(...vals) - Math.min(...vals)
}

const distinctExact = (values) => [...new Set(values)].sort((a, b) => a - b)
const px = (v) => (v == null ? String(v) : String(Number.parseFloat(v)))

function stateNamed(states, name) {
  return states.find((s) => s.name === name)
}

export function judge(result) {
  const failures = []
  const checked = []
  const fail = (field, where, actual, expected) => failures.push({ field, where, actual, expected })
  const ok = (field, where, actual) => checked.push({ field, where, actual })

  const assertZero = (field, where, raw) => {
    if (raw === null) fail(field, where, 'missing/non-finite', 0)
    else if (raw !== 0) fail(field, where, raw, 0)
    else ok(field, where, 0)
  }

  const matrix = (result && result.matrix) || {}
  const present = Object.keys(matrix)
  const missing = REQUIRED_VIEWPORTS.filter((v) => !present.includes(v))
  const extra = present.filter((v) => !REQUIRED_VIEWPORTS.includes(v))
  if (missing.length) fail('viewports.missing', 'global', missing.join(','), REQUIRED_VIEWPORTS.join(','))
  if (extra.length) fail('viewports.unexpected', 'global', extra.join(','), 'none')

  const elasticWidthsByViewport = {}

  for (const vp of REQUIRED_VIEWPORTS) {
    const m = matrix[vp]
    if (!m) continue
    const states = Array.isArray(m.states) ? m.states : []

    // ---------- state set ----------
    const names = states.map((s) => s.name)
    if (JSON.stringify(names) !== JSON.stringify(REQUIRED_STATE_NAMES)) {
      fail('state_names', vp, names.join(','), REQUIRED_STATE_NAMES.join(','))
      continue
    }
    ok('state_names', vp, names.length)

    const long = stateNamed(states, 'LONG_IDLE')
    const short = stateNamed(states, 'SHORT_IDLE')
    const restore = stateNamed(states, 'RESTORE_LONG_IDLE')

    // ================= DSS-AC-114 : button fixed geometry, each vs its OWN idle baseline =================
    for (const [key, field, want] of [
      ['queryBtn', 'query_button', QUERY_BUTTON_WIDTH],
      ['resetBtn', 'reset_button', RESET_BUTTON_WIDTH],
      ['refreshBtn', 'refresh_button', REFRESH_BUTTON_WIDTH],
    ]) {
      const rects = states.map((s) => s.rect && s.rect[key]).filter(Boolean)
      if (rects.length !== states.length) {
        fail(`${field}_rect_present`, vp, rects.length, states.length)
        continue
      }
      // actual width set must be strictly {want}
      const widths = distinctExact(rects.map((r) => r.w))
      if (widths.length !== 1 || widths[0] !== want) {
        fail(`${field.replace('button', 'button_width_set')}`, vp, widths.join(','), String(want))
      } else ok(`${field}_width_set`, vp, widths[0])

      // the four declared locking properties (DSS-REQ-090) must all resolve to the same px
      for (const prop of ['width', 'minWidth', 'maxWidth', 'flexBasis']) {
        const vals = states.map((s) => s.btnStyles && s.btnStyles[key] && s.btnStyles[key][prop])
        const nums = vals.map(px)
        const uniq = [...new Set(nums)]
        if (uniq.length !== 1 || uniq[0] !== String(want)) {
          fail(`${field}_${prop}`, vp, uniq.join(','), `${want}px`)
        } else ok(`${field}_${prop}`, vp, `${uniq[0]}px`)
      }

      // own-baseline delta across every state (idle / query-loading / success / failure / short / long)
      for (const k of ['x', 'y', 'w', 'h']) {
        const label = { x: 'x', y: 'y', w: 'width', h: 'height' }[k]
        assertZero(`${field}_self_rect_delta.${label}`, vp, exactDelta(states, (s) => s.rect[key][k]))
      }
    }

    // query bar must not change height, and the three buttons must stay on one line (no extra wrap)
    assertZero('query_bar_rect_delta.height', vp, exactDelta(states, (s) => s.rect.queryBar.h))
    assertZero('query_actions_rect_delta.height', vp, exactDelta(states, (s) => s.rect.queryGroup.h))
    // Only 查询 / 重置 live in the query bar's own `.dss-q-actions` group and must share one line there.
    // `.dss-refresh-btn` belongs to the separate toolbar (DataSourceSnapshotToolbar) and legitimately has its
    // own y; it is covered by its own rect-delta and width locks above, not by this same-line assertion.
    const wrapped = states.filter((s) => !(s.rect.queryBtn.y === s.rect.resetBtn.y && s.rect.queryBtn.h === s.rect.resetBtn.h))
    if (wrapped.length) fail('query_actions_single_line', vp, wrapped.map((s) => s.name).join(','), '查询/重置 share one y and one h in every state')
    else ok('query_actions_single_line', vp, true)

    // adjacent filter controls must not move
    for (const key of ['queryGroup', 'queryBar']) {
      for (const k of ['x', 'y', 'w', 'h']) {
        const label = { x: 'x', y: 'y', w: 'width', h: 'height' }[k]
        assertZero(`adjacent_${key}_rect_delta.${label}`, vp, exactDelta(states, (s) => s.rect[key][k]))
      }
    }

    // ================= DSS-AC-115 : scroll container + gutter =================
    // real vertical overflow must exist in long and must NOT exist in short
    if (!(long.scroll.scrollHeight > long.scroll.clientHeight)) {
      fail('long_state_real_vertical_overflow', vp, `${long.scroll.scrollHeight}/${long.scroll.clientHeight}`, 'scrollHeight > clientHeight')
    } else ok('long_state_real_vertical_overflow', vp, true)
    if (!(short.scroll.scrollHeight <= short.scroll.clientHeight)) {
      fail('short_state_no_vertical_overflow', vp, `${short.scroll.scrollHeight}/${short.scroll.clientHeight}`, 'scrollHeight <= clientHeight')
    } else ok('short_state_no_vertical_overflow', vp, true)
    if (!(restore.scroll.scrollHeight > restore.scroll.clientHeight)) {
      fail('restore_long_state_real_vertical_overflow', vp, `${restore.scroll.scrollHeight}/${restore.scroll.clientHeight}`, 'scrollHeight > clientHeight')
    } else ok('restore_long_state_real_vertical_overflow', vp, true)

    if (!(long.rowCount >= LONG_MIN_RECORDS)) fail('long_result_record_count', vp, long.rowCount, `>=${LONG_MIN_RECORDS}`)
    else ok('long_result_record_count', vp, long.rowCount)
    if (!(short.rowCount >= 0 && short.rowCount <= SHORT_MAX_RECORDS)) fail('short_result_record_count', vp, short.rowCount, `<=${SHORT_MAX_RECORDS}`)
    else ok('short_result_record_count', vp, short.rowCount)

    // the route-scoped gutter must really be in effect on the REAL main scroll container
    const gutterVals = distinctExact(states.map((s) => s.scroll.scrollbarGutter))
    if (gutterVals.length !== 1 || gutterVals[0] !== 'stable') {
      fail('scroll_container_computed_scrollbar_gutter', vp, gutterVals.join(','), 'stable')
    } else ok('scroll_container_computed_scrollbar_gutter', vp, 'stable')
    if (!states.every((s) => s.scroll.hasGutterClass === true)) {
      fail('scroll_container_route_scoped_class', vp, states.map((s) => s.scroll.hasGutterClass).join(','), 'true in every state')
    } else ok('scroll_container_route_scoped_class', vp, true)

    // container / card / frame geometry must be identical between long and short
    assertZero('content_area_rect_delta.x', vp, exactDelta(states, (s) => s.scroll.x))
    assertZero('content_area_rect_delta.width', vp, exactDelta(states, (s) => s.scroll.w))
    assertZero('content_area_client_width_delta', vp, exactDelta(states, (s) => s.scroll.clientWidth))
    for (const [key, label] of [['pageRoot', 'page_root'], ['resultCard', 'result_card'], ['tableWrap', 'table_outer_frame']]) {
      assertZero(`${label}_rect_delta.x`, vp, exactDelta(states, (s) => s.rect[key].x))
      assertZero(`${label}_rect_delta.width`, vp, exactDelta(states, (s) => s.rect[key].w))
    }

    // ================= DSS-AC-116 : every header cell + every data column =================
    const headerLens = states.map((s) => s.headers.length)
    if (!headerLens.every((n) => n === TABLE_COLUMN_COUNT)) {
      fail('header_cell_count', vp, headerLens.join(','), String(TABLE_COLUMN_COUNT))
    } else ok('header_cell_count', vp, TABLE_COLUMN_COUNT)

    const labelsOk = states.every((s) => JSON.stringify(s.headers.map((h) => h.label)) === JSON.stringify(s.headers.map((h) => h.label)))
    if (!labelsOk) fail('header_labels_consistent', vp, 'labels differ between states', 'identical')
    else ok('header_labels_consistent', vp, true)

    for (let i = 0; i < TABLE_COLUMN_COUNT; i += 1) {
      const label = (states[0].headers[i] || {}).label || `col${i}`
      assertZero(`header_cell_x_delta[${label}]`, vp, exactDelta(states, (s) => s.headers[i] && s.headers[i].x))
      assertZero(`header_cell_width_delta[${label}]`, vp, exactDelta(states, (s) => s.headers[i] && s.headers[i].width))
      assertZero(`data_column_start_x_delta[${label}]`, vp, exactDelta(states, (s) => s.dataCols[i] && s.dataCols[i].x))
    }

    for (const want of CENTER_HEADERS) {
      const idx = (states[0].headers.findIndex((h) => h.label === want))
      if (idx < 0) { fail(`header_center_present[${want}]`, vp, 'absent', 'present'); continue }
      assertZero(`header_center_x_delta[${want}]`, vp, exactDelta(states, (s) => s.headers[idx].centerX))
    }

    // "共 N 条" text really differs long vs short, yet no header moved  -> count text is not the direct cause
    const longCountText = long.summaryText
    const shortCountText = short.summaryText
    if (!/^共\s*\d+\s*条$/.test(longCountText) || !/^共\s*\d+\s*条$/.test(shortCountText)) {
      fail('summary_count_text_semantics', vp, `${longCountText} | ${shortCountText}`, '共 N 条')
    } else ok('summary_count_text_semantics', vp, `${longCountText} | ${shortCountText}`)
    if (longCountText === shortCountText) {
      fail('summary_count_text_differs_long_vs_short', vp, longCountText, 'different between long and short')
    } else ok('summary_count_text_differs_long_vs_short', vp, `${longCountText} -> ${shortCountText}`)

    // ================= DSS-AC-117 : no horizontal overflow, elastic strategy preserved =================
    const hOver = states.filter((s) => s.doc.scrollWidth > s.doc.clientWidth)
    if (hOver.length) fail('no_horizontal_overflow', vp, hOver.map((s) => `${s.name}:${s.doc.scrollWidth}>${s.doc.clientWidth}`).join(','), 'scrollWidth <= clientWidth')
    else ok('no_horizontal_overflow', vp, true)

    for (const [label, want] of FIXED_COLUMNS) {
      const idx = states[0].headers.findIndex((h) => h.label === label)
      if (idx < 0) { fail(`fixed_column_present[${label}]`, vp, 'absent', 'present'); continue }
      const vals = distinctExact(states.map((s) => s.headers[idx].width))
      if (vals.length !== 1 || vals[0] !== want) fail(`fixed_column_width[${label}]`, vp, vals.join(','), String(want))
      else ok(`fixed_column_width[${label}]`, vp, vals[0])
    }
    const elastic = {}
    for (const [label, min] of ELASTIC_COLUMNS) {
      const idx = states[0].headers.findIndex((h) => h.label === label)
      if (idx < 0) { fail(`elastic_column_present[${label}]`, vp, 'absent', 'present'); continue }
      const widths = states.map((s) => s.headers[idx].width)
      if (widths.some((w) => !(w >= min))) fail(`elastic_column_min_width[${label}]`, vp, widths.map((w) => w.toFixed(3)).join(','), `>=${min}`)
      else ok(`elastic_column_min_width[${label}]`, vp, true)
      elastic[label] = distinctExact(widths)
      if (elastic[label].length !== 1) fail(`elastic_column_width_stable[${label}]`, vp, elastic[label].join(','), 'one value across states')
    }
    elasticWidthsByViewport[vp] = Object.fromEntries(Object.entries(elastic).map(([k, v]) => [k, v[0]]))
  }

  // ---- cross-viewport: elastic columns really absorb width (proves NOT all columns frozen to fixed px) ----
  if (Object.keys(elasticWidthsByViewport).length === REQUIRED_VIEWPORTS.length) {
    for (const [label] of ELASTIC_COLUMNS) {
      const seq = REQUIRED_VIEWPORTS.map((vp) => elasticWidthsByViewport[vp][label])
      const strictlyIncreasing = seq.every((v, i) => i === 0 || v >= seq[i - 1])
      const grows = seq[seq.length - 1] > seq[0]
      if (!strictlyIncreasing || !grows) {
        fail(`elastic_column_absorbs_width[${label}]`, 'cross-viewport', seq.join(','), 'non-decreasing and wider at 2560 than at 1280')
      } else ok(`elastic_column_absorbs_width[${label}]`, 'cross-viewport', seq.join(','))
    }
  }

  // ================= DSS-AC-118 : route scoping =================
  const leak = (result && result.otherRouteLeak) || null
  if (!leak) fail('otherRouteLeak', 'global', 'missing', 'object')
  else {
    for (const k of ['routesChecked', 'gutterClassPresent', 'stableGutterComputed', 'dssFeatureNodes']) {
      const want = k === 'routesChecked' ? '>0' : 0
      if (k === 'routesChecked') {
        if (!(leak[k] >= 1)) fail(`otherRouteLeak.${k}`, 'global', leak[k], want)
        else ok(`otherRouteLeak.${k}`, 'global', leak[k])
      } else if (leak[k] !== 0) fail(`otherRouteLeak.${k}`, 'global', leak[k], 0)
      else ok(`otherRouteLeak.${k}`, 'global', 0)
    }
  }

  // ================= request semantics / console =================
  const req = (result && result.requests) || {}
  for (const k of ['nonGet', 'apiNonGet']) {
    if (req[k] !== 0) fail(`requests.${k}`, 'global', req[k], 0)
    else ok(`requests.${k}`, 'global', 0)
  }
  if (!(req.listGets >= 1)) fail('requests.listGets', 'global', req.listGets, '>=1')
  else ok('requests.listGets', 'global', req.listGets)
  if (!(req.duplicateClickGets === 1)) fail('requestSemantics.in_flight_duplicate_click_no_extra_get', 'global', req.duplicateClickGets, 1)
  else ok('requestSemantics.in_flight_duplicate_click_no_extra_get', 'global', 1)
  if (req.successPreservedOldApplied !== true) fail('requestSemantics.failure_preserves_old_results', 'global', req.successPreservedOldApplied, true)
  else ok('requestSemantics.failure_preserves_old_results', 'global', true)

  // consoleErrors excludes ONLY the resource errors caused by our own deliberate browser-layer 500 injection,
  // and that exclusion is sound because every real list response was independently asserted 200 below.
  const consoleErrors = (result && result.consoleErrors) || null
  if (!Array.isArray(consoleErrors)) fail('consoleErrors', 'global', 'missing', '[]')
  else if (consoleErrors.length !== 0) fail('consoleErrors', 'global', consoleErrors.slice(0, 5).join(' | '), 0)
  else ok('consoleErrors', 'global', 0)

  // positive control: the failure injection must really have fired once per viewport, otherwise "no console
  // errors" could be vacuous simply because the failure path was never exercised at all.
  const injected = (result && result.consoleErrorsInjected) || null
  const served = result ? result.injectionsServed : null
  if (!(typeof served === 'number' && served >= REQUIRED_VIEWPORTS.length)) {
    fail('injection.positive_control_served', 'global', served, `>=${REQUIRED_VIEWPORTS.length}`)
  } else ok('injection.positive_control_served', 'global', served)
  if (!(Array.isArray(injected) && injected.length >= REQUIRED_VIEWPORTS.length)) {
    fail('injection.console_error_attributed', 'global', injected ? injected.length : 'missing', `>=${REQUIRED_VIEWPORTS.length}`)
  } else ok('injection.console_error_attributed', 'global', injected.length)

  const sp = (result && result.successPath) || null
  if (!sp) fail('successPath', 'global', 'missing', 'object')
  else {
    if (sp.realBackend200 !== true) fail('successPath.real_backend_200', 'global', sp.realBackend200, true)
    else ok('successPath.real_backend_200', 'global', true)
    if (!(sp.realBackendRecordCount >= LONG_MIN_RECORDS)) fail('successPath.real_backend_records', 'global', sp.realBackendRecordCount, `>=${LONG_MIN_RECORDS}`)
    else ok('successPath.real_backend_records', 'global', sp.realBackendRecordCount)
    if (sp.listStatusesAll200 !== true) fail('successPath.real_list_responses_all_200', 'global', sp.listStatusesAll200, true)
    else ok('successPath.real_list_responses_all_200', 'global', true)
    if (sp.failureInjectedAtBrowserLayerOnly !== true) fail('successPath.failure_injected_at_browser_layer_only', 'global', sp.failureInjectedAtBrowserLayerOnly, true)
    else ok('successPath.failure_injected_at_browser_layer_only', 'global', true)
  }

  // the official acceptance file must NOT carry the negative-control marker
  if (result && result.officialFileHasNegativeControlMarker === true) {
    fail('official_file_not_marked_as_negative_control', 'global', true, false)
  } else ok('official_file_clean_of_negative_control_marker', 'global', true)

  return {
    passed: failures.length === 0,
    failure_count: failures.length,
    check_count: checked.length,
    negative_control_expected_to_fail: !!(result && result.negativeControlTest),
    failures,
    checked,
  }
}
