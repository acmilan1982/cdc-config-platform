// FORMAL ACCEPTANCE assertion module
// (DATA-SOURCE-SNAPSHOT-STATUS-ACTION-BUTTON-LOADING-VISUAL-STABILITY-FORMAL-ACCEPTANCE-001).
//
// Pure function of an already-collected result object. All geometry deltas are RECOMPUTED here from the raw
// per-state getBoundingClientRect() values with NO rounding and are required to be exactly === 0 (Prompt §7.4:
// no tolerance, no right-anchor substitute, no rounding mask). The 3-decimal `deltas` object written by the
// recorder is compared against the recomputed raw value as well, so a sub-0.001 displacement cannot hide.
//
// This module judges ONLY what the acceptance criteria DSS-AC-108~113 state. It does not invent criteria.

export const REQUIRED_VIEWPORTS = ['1280x800', '1700x920', '1920x1080', '2560x1440']
export const REQUIRED_STATE_COUNT = 20
export const REQUIRED_QUERY_BUTTON_WIDTH = 62
export const REQUIRED_REFRESH_BUTTON_WIDTH = 110

export const REQUIRED_STATE_NAMES = [
  'TIME_--',
  'TIME_00:00:00',
  'TIME_11:11:11',
  'TIME_14:11:09',
  'TIME_14:11:10',
  'TIME_14:11:11',
  'TIME_23:59:59',
  'COUNT_60',
  'COUNT_59',
  'COUNT_10',
  'COUNT_9',
  'COUNT_0',
  'COUNT_--',
  'IDLE',
  'MANUAL_LOADING',
  'MANUAL_SUCCESS',
  'MANUAL_FAILURE',
  'QUERY_LOADING',
  'QUERY_SUCCESS',
  'QUERY_FAILURE',
]

// [assertion field, raw per-state getter, raw rect keys, recorded-delta key names]
const RECT_DELTA_SPECS = [
  ['refresh_group_rect_delta', (s) => s.group, ['x', 'y', 'w', 'h'], { x: 'x', y: 'y', w: 'width', h: 'height' }],
  ['refresh_time_rect_delta', (s) => s.time, ['w'], { w: 'width' }],
  ['refresh_time_value_rect_delta', (s) => s.timeValue, ['w'], { w: 'width' }],
  ['refresh_time_prefix_rect_delta', (s) => s.timePrefix, ['w'], { w: 'width' }],
  ['countdown_seconds_slot_rect_delta', (s) => s.secs, ['w'], { w: 'width' }],
  ['refresh_btn_rect_delta', (s) => s.refreshBtn, ['x', 'y', 'w', 'h'], { x: 'x', y: 'y', w: 'width', h: 'height' }],
  ['query_btn_rect_delta', (s) => s.queryBtn, ['x', 'y', 'w', 'h'], { x: 'x', y: 'y', w: 'width', h: 'height' }],
  ['query_actions_rect_delta', (s) => s.queryActions, ['x', 'y', 'w', 'h'], { x: 'x', y: 'y', w: 'width', h: 'height' }],
  ['query_bar_rect_delta', (s) => s.queryBar, ['x', 'y', 'w', 'h'], { x: 'x', y: 'y', w: 'width', h: 'height' }],
  // DSS-AC-113 adjacent controls
  ['reset_btn_rect_delta', (s) => s.resetBtn, ['x', 'y', 'w', 'h'], { x: 'x', y: 'y', w: 'width', h: 'height' }],
  ['query_group_rect_delta', (s) => s.queryGroup, ['x', 'y', 'w', 'h'], { x: 'x', y: 'y', w: 'width', h: 'height' }],
  ['refresh_sep_rect_delta', (s) => s.refreshSep, ['x', 'y', 'w', 'h'], { x: 'x', y: 'y', w: 'width', h: 'height' }],
]

function exactDelta(states, getter) {
  const vals = states.map(getter)
  if (vals.some((v) => typeof v !== 'number' || !Number.isFinite(v))) return null
  return Math.max(...vals) - Math.min(...vals)
}

const distinctExact = (values) => [...new Set(values)].sort((a, b) => a - b)
const centerX = (s, sel) => s[sel].x + s[sel].w / 2
const centerY = (s, sel) => s[sel].y + s[sel].h / 2

export function evaluateAcceptanceResult(result) {
  const failures = []
  const checked = []
  const fail = (field, where, actual, expected) => failures.push({ field, where, actual, expected })
  const ok = (field, where, actual) => checked.push({ field, where, actual })

  const assertExactZero = (field, where, raw, recorded) => {
    if (raw === null || raw !== 0) {
      fail(field, where, raw, 0)
      return
    }
    if (recorded !== undefined && recorded !== 0) {
      fail(`${field} (recorded)`, where, recorded, 0)
      return
    }
    ok(field, where, raw)
  }

  const matrix = (result && result.matrix) || {}
  const present = Object.keys(matrix)
  const missing = REQUIRED_VIEWPORTS.filter((v) => !present.includes(v))
  const extra = present.filter((v) => !REQUIRED_VIEWPORTS.includes(v))
  if (missing.length) fail('viewports.missing', 'global', missing.join(','), REQUIRED_VIEWPORTS.join(','))
  if (extra.length) fail('viewports.unexpected', 'global', extra.join(','), 'none')

  for (const vp of REQUIRED_VIEWPORTS) {
    const m = matrix[vp]
    if (!m) continue
    const states = Array.isArray(m.states) ? m.states : []
    const deltas = m.deltas || {}
    const invariants = m.invariants || {}

    // ---- 20 states, exactly the intended set
    if (states.length !== REQUIRED_STATE_COUNT) fail('state_count', vp, states.length, REQUIRED_STATE_COUNT)
    else ok('state_count', vp, states.length)
    const names = states.map((s) => s.name)
    if (JSON.stringify(names) !== JSON.stringify(REQUIRED_STATE_NAMES)) {
      fail('state_names', vp, names.join(','), REQUIRED_STATE_NAMES.join(','))
    }

    // ---- DSS-AC-108/109/110/111/113: every measured rect delta must be exactly 0
    for (const [field, getter, rawKeys, keyMap] of RECT_DELTA_SPECS) {
      for (const k of rawKeys) {
        const raw = exactDelta(states, (s) => getter(s)[k])
        assertExactZero(`${field}.${keyMap[k]}`, vp, raw, deltas[field] ? deltas[field][keyMap[k]] : undefined)
      }
    }

    // ---- DSS-AC-109/111: label centres x AND y exactly 0
    for (const [field, sel] of [
      ['refresh_label_center_delta', 'refreshLabel'],
      ['query_label_center_delta', 'queryLabel'],
    ]) {
      const rx = exactDelta(states, (s) => centerX(s, sel))
      const ry = exactDelta(states, (s) => centerY(s, sel))
      assertExactZero(`${field}.x`, vp, rx, deltas[field] ? deltas[field].x : undefined)
      assertExactZero(`${field}.y`, vp, ry, deltas[field] ? deltas[field].y : undefined)
    }

    // ---- indicator does not enter the content flow and does not overlap the label
    //      (indicator box must lie strictly left of the label box and inside the button box)
    for (const [field, btnSel, labelSel, spinSel] of [
      ['query', 'queryBtn', 'queryLabel', 'querySpinnerBox'],
      ['refresh', 'refreshBtn', 'refreshLabel', 'refreshSpinnerBox'],
    ]) {
      const bad = states.filter((s) => {
        const b = s[btnSel]
        const l = s[labelSel]
        const sp = s[spinSel]
        if (!b || !l || !sp) return true
        const inside = sp.x >= b.x && sp.x + sp.w <= b.x + b.w && sp.y >= b.y && sp.y + sp.h <= b.y + b.h
        const leftOfLabel = sp.x + sp.w <= l.x + 0.0001
        return !(inside && leftOfLabel)
      })
      if (bad.length) {
        fail(
          `${field}_indicator_in_left_blank_outside_content_flow`,
          vp,
          bad.map((s) => s.name).join(','),
          'indicator strictly inside button and fully left of the label in every state',
        )
      } else ok(`${field}_indicator_in_left_blank_outside_content_flow`, vp, true)
    }

    // ---- DSS-AC-108 / DSS-AC-110: actual width sets
    const qw = distinctExact(states.map((s) => s.queryBtn.w))
    if (qw.length !== 1 || qw[0] !== REQUIRED_QUERY_BUTTON_WIDTH) {
      fail('query_button_actual_width_set', vp, qw.join(','), String(REQUIRED_QUERY_BUTTON_WIDTH))
    } else ok('query_button_actual_width_set', vp, qw[0])
    const rw = distinctExact(states.map((s) => s.refreshBtn.w))
    if (rw.length !== 1 || rw[0] !== REQUIRED_REFRESH_BUTTON_WIDTH) {
      fail('refresh_button_actual_width_set', vp, rw.join(','), String(REQUIRED_REFRESH_BUTTON_WIDTH))
    } else ok('refresh_button_actual_width_set', vp, rw[0])

    // ---- Element Plus default loading icon must not enter the button content flow
    const epLoading = states.filter((s) => s.elementPlusLoadingIcon >= 1)
    if (epLoading.length) {
      fail('element_plus_default_loading_icon_absent', vp, epLoading.map((s) => `${s.name}:${s.elementPlusLoadingIcon}`).join(','), 0)
    } else ok('element_plus_default_loading_icon_absent', vp, 0)

    // ---- DSS-AC-109 / DSS-AC-111: labels constant, indicator aria-hidden, no duplicate node
    for (const [field, key, want] of [
      ['refresh_label_text_always', 'refreshLabel', '立即刷新'],
      ['query_label_text_always', 'queryLabel', '查询'],
    ]) {
      if (!states.every((s) => s.texts && s.texts[key] === want)) {
        fail(field, vp, states.map((s) => s.texts && s.texts[key]).join('|'), want)
      } else ok(field, vp, want)
    }
    if (!states.every((s) => s.aria.refreshSpinnerHidden === 'true' && s.aria.querySpinnerHidden === 'true')) {
      fail('spinners_aria_hidden_always', vp, states.map((s) => `${s.aria.refreshSpinnerHidden}/${s.aria.querySpinnerHidden}`).join(','), 'true/true')
    } else ok('spinners_aria_hidden_always', vp, 'true/true')
    const nodeCountSets = new Set(states.map((s) => JSON.stringify(s.nodeCounts)))
    if (nodeCountSets.size !== 1 || !states.every((s) => s.nodeCounts.refreshSpinner === 1 && s.nodeCounts.querySpinner === 1)) {
      fail('indicator_single_persistent_node', vp, [...nodeCountSets].join('|'), 'one refresh + one query indicator node in every state')
    } else ok('indicator_single_persistent_node', vp, true)

    // ---- DSS-AC-112 (state independence + aria semantics)
    const badRefresh = states.filter((s) => (s.name === 'MANUAL_LOADING' ? s.spinnerVisible.refresh !== true : s.spinnerVisible.refresh !== false))
    if (badRefresh.length) fail('refresh_indicator_only_in_own_loading', vp, badRefresh.map((s) => `${s.name}:${s.spinnerVisible.refresh}`).join(','), 'true only in MANUAL_LOADING')
    else ok('refresh_indicator_only_in_own_loading', vp, true)
    const badQuery = states.filter((s) => (s.name === 'QUERY_LOADING' ? s.spinnerVisible.query !== true : s.spinnerVisible.query !== false))
    if (badQuery.length) fail('query_indicator_only_in_own_loading', vp, badQuery.map((s) => `${s.name}:${s.spinnerVisible.query}`).join(','), 'true only in QUERY_LOADING')
    else ok('query_indicator_only_in_own_loading', vp, true)

    const busyBad = states.filter((s) => (s.name === 'MANUAL_LOADING' ? s.aria.refreshBusy !== 'true' : s.aria.refreshBusy !== null))
    if (busyBad.length) fail('refresh_aria_busy_only_in_own_loading', vp, busyBad.map((s) => `${s.name}:${s.aria.refreshBusy}`).join(','), 'true only in MANUAL_LOADING')
    else ok('refresh_aria_busy_only_in_own_loading', vp, true)
    const qBusyBad = states.filter((s) => (s.name === 'QUERY_LOADING' ? s.aria.queryBusy !== 'true' : s.aria.queryBusy !== null))
    if (qBusyBad.length) fail('query_aria_busy_only_in_own_loading', vp, qBusyBad.map((s) => `${s.name}:${s.aria.queryBusy}`).join(','), 'true only in QUERY_LOADING')
    else ok('query_aria_busy_only_in_own_loading', vp, true)

    const locked = new Set(['MANUAL_LOADING', 'QUERY_LOADING'])
    const ariaDisabledBad = states.filter((s) =>
      locked.has(s.name)
        ? !(s.aria.refreshDisabled === 'true' && s.aria.queryDisabled === 'true')
        : !(s.aria.refreshDisabled === null && s.aria.queryDisabled === null),
    )
    if (ariaDisabledBad.length) fail('aria_disabled_present_only_while_locked', vp, ariaDisabledBad.map((s) => `${s.name}:${s.aria.refreshDisabled}/${s.aria.queryDisabled}`).join(','), 'true/true while locked, null otherwise')
    else ok('aria_disabled_present_only_while_locked', vp, true)

    if (!states.every((s) => s.nativeDisabled.refresh === false && s.nativeDisabled.query === false)) {
      fail('buttons_never_natively_disabled', vp, states.filter((s) => s.nativeDisabled.refresh || s.nativeDisabled.query).map((s) => s.name).join(','), 'false/false')
    } else ok('buttons_never_natively_disabled', vp, true)

    // ---- DSS-AC-113: no horizontal overflow in any state
    const overflow = states.filter((s) => s.doc.scrollWidth > s.doc.clientWidth + 0.0001)
    if (overflow.length) fail('no_horizontal_overflow', vp, overflow.map((s) => `${s.name}:${s.doc.scrollWidth}>${s.doc.clientWidth}`).join(','), 'scrollWidth <= clientWidth')
    else ok('no_horizontal_overflow', vp, true)

    // ---- recorded invariants (must exist and all be true)
    const invKeys = Object.keys(invariants)
    if (invKeys.length === 0) fail('invariants_present', vp, 0, '>0')
    for (const k of invKeys) {
      if (invariants[k] !== true) fail(`invariant.${k}`, vp, invariants[k], true)
      else ok(`invariant.${k}`, vp, true)
    }
  }

  // ---- global: request semantics
  const req = (result && result.requests) || {}
  for (const k of ['nonGet', 'apiNonGet']) {
    if (req[k] !== 0) fail(`requests.${k}`, 'global', req[k], 0)
    else ok(`requests.${k}`, 'global', 0)
  }

  const consoleErrors = result && Array.isArray(result.consoleErrors) ? result.consoleErrors : null
  if (consoleErrors === null) fail('consoleErrors', 'global', 'missing', '[]')
  else if (consoleErrors.length !== 0) fail('consoleErrors', 'global', consoleErrors.join(' | '), 0)
  else ok('consoleErrors', 'global', 0)

  const leak = (result && result.otherRouteLeak) || null
  if (!leak) fail('otherRouteLeak', 'global', 'missing', 'all zero')
  else for (const k of ['dssNodes', 'refreshGroup', 'spinner', 'actionLabel']) {
    if (leak[k] !== 0) fail(`otherRouteLeak.${k}`, 'global', leak[k], 0)
    else ok(`otherRouteLeak.${k}`, 'global', 0)
  }

  // ---- reduced motion (DSS-AC-109 / DSS-AC-112)
  const rm = (result && result.reducedMotion) || null
  if (!rm) fail('reducedMotion', 'global', 'missing', 'object')
  else {
    for (const k of ['refreshSpinner', 'querySpinner']) {
      if (rm.reducedMediaAnimation?.[k] !== 'none') fail(`reducedMotion.animation.${k}`, 'global', rm.reducedMediaAnimation?.[k], 'none')
      else ok(`reducedMotion.animation.${k}`, 'global', 'none')
    }
    if (rm.reducedLoadingSpinnerVisible?.refresh !== true) fail('reducedMotion.indicatorStaticallyVisible', 'global', rm.reducedLoadingSpinnerVisible?.refresh, true)
    else ok('reducedMotion.indicatorStaticallyVisible', 'global', true)
    if (rm.idleVsReducedIdleSameRect !== true) fail('reducedMotion.idleVsReducedIdleSameRect', 'global', rm.idleVsReducedIdleSameRect, true)
    else ok('reducedMotion.idleVsReducedIdleSameRect', 'global', true)
    if (rm.reducedIdleVsReducedLoadingSameRect !== true) fail('reducedMotion.idleVsLoadingSameRect', 'global', rm.reducedIdleVsReducedLoadingSameRect, true)
    else ok('reducedMotion.idleVsLoadingSameRect', 'global', true)
    if (rm.queryIndicatorAlsoStillInReducedMotion !== true) fail('reducedMotion.queryIndicatorStaticallyVisible', 'global', rm.queryIndicatorAlsoStillInReducedMotion, true)
    else ok('reducedMotion.queryIndicatorStaticallyVisible', 'global', true)
  }

  // ---- DSS-AC-112 request semantics (single flight, duplicates, hidden/resume)
  const sem = (result && result.requestSemantics) || null
  if (!sem) fail('requestSemantics', 'global', 'missing', 'object')
  else {
    const expect = [
      ['single_click_exactly_one_get', sem.singleClickGets, 1],
      ['in_flight_duplicate_click_no_extra_get', sem.duplicateClickGets, 1],
      ['other_button_while_locked_no_extra_get', sem.crossButtonGets, 1],
      ['enter_while_locked_no_extra_get', sem.enterGets, 1],
      ['hidden_freezes_and_resume_one_recovery_get', sem.hiddenResumeGets, 2],
    ]
    for (const [field, actual, want] of expect) {
      if (actual !== want) fail(`requestSemantics.${field}`, 'global', actual, want)
      else ok(`requestSemantics.${field}`, 'global', actual)
    }
    if (sem.resumeLitNoManualIndicator !== true) fail('requestSemantics.resume_no_manual_indicator', 'global', sem.resumeLitNoManualIndicator, true)
    else ok('requestSemantics.resume_no_manual_indicator', 'global', true)
    if (sem.failurePreservedOldApplied !== true) fail('requestSemantics.failure_preserves_old_results', 'global', sem.failurePreservedOldApplied, true)
    else ok('requestSemantics.failure_preserves_old_results', 'global', true)
    if (sem.failureShowedConvergedError !== true) fail('requestSemantics.failure_shows_converged_error', 'global', sem.failureShowedConvergedError, true)
    else ok('requestSemantics.failure_shows_converged_error', 'global', true)
    if (sem.successUpdatedData !== true) fail('requestSemantics.success_updates_data', 'global', sem.successUpdatedData, true)
    else ok('requestSemantics.success_updates_data', 'global', true)
    if (sem.successUpdatedLastRefreshTime !== true) fail('requestSemantics.success_updates_last_refresh_time', 'global', sem.successUpdatedLastRefreshTime, true)
    else ok('requestSemantics.success_updates_last_refresh_time', 'global', true)
    if (sem.writeRequests !== 0) fail('requestSemantics.write_requests', 'global', sem.writeRequests, 0)
    else ok('requestSemantics.write_requests', 'global', 0)
  }

  // ---- success path must have been served by the REAL backend (Prompt §7.5)
  const sp = (result && result.successPath) || null
  if (!sp) fail('successPath', 'global', 'missing', 'object')
  else {
    if (sp.realBackend200 !== true) fail('successPath.real_backend_200', 'global', sp.realBackend200, true)
    else ok('successPath.real_backend_200', 'global', true)
    if (sp.realBackendRecordCount < 1) fail('successPath.real_backend_records', 'global', sp.realBackendRecordCount, '>=1')
    else ok('successPath.real_backend_records', 'global', sp.realBackendRecordCount)
  }

  return { passed: failures.length === 0, failure_count: failures.length, check_count: checked.length, failures, checked }
}
