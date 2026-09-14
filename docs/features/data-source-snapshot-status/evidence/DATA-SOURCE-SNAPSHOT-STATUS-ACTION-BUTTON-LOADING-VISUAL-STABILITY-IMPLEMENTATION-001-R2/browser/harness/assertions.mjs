// R2 strict assertion module (DATA-SOURCE-SNAPSHOT-STATUS-ACTION-BUTTON-LOADING-VISUAL-STABILITY-IMPLEMENTATION-001-R2).
//
// R1's strict.mjs only COMPUTED and PRINTED deltas/invariants: apart from runtime exceptions it performed no
// failing assertion, so `exit=0` proved only "the script ran to completion". This module is the missing
// machine judgement. It is a PURE function of an already-collected result object, so the real browser run
// (strict.mjs) and the page-free negative self-test (negative-self-test.mjs) share one single judgement and
// cannot drift apart.
//
// Deliberately stricter than the recorder: all deltas are RECOMPUTED here from the raw per-state rects with
// no rounding, and are required to be exactly === 0. The 3-decimal `deltas` object written by the recorder is
// also compared against the recomputed raw value, so a sub-0.001 displacement can never be rounded away.

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

// [assertion field, raw per-state getter, recorded deltas path]
const RECT_DELTA_SPECS = [
  ['refresh_group_rect_delta', (s) => s.group, ['x', 'y', 'w', 'h'], { x: 'x', y: 'y', width: 'width', height: 'height' }],
  ['refresh_time_rect_delta', (s) => s.time, ['w'], { width: 'width' }],
  ['refresh_time_value_rect_delta', (s) => s.timeValue, ['w'], { width: 'width' }],
  ['refresh_time_prefix_rect_delta', (s) => s.timePrefix, ['w'], { width: 'width' }],
  ['countdown_seconds_slot_rect_delta', (s) => s.secs, ['w'], { width: 'width' }],
  [
    'refresh_btn_rect_delta',
    (s) => s.refreshBtn,
    ['x', 'y', 'w', 'h'],
    { x: 'x', y: 'y', width: 'width', height: 'height' },
  ],
  [
    'query_btn_rect_delta',
    (s) => s.queryBtn,
    ['x', 'y', 'w', 'h'],
    { x: 'x', y: 'y', width: 'width', height: 'height' },
  ],
  [
    'query_actions_rect_delta',
    (s) => s.queryActions,
    ['x', 'y', 'w', 'h'],
    { x: 'x', y: 'y', width: 'width', height: 'height' },
  ],
  [
    'query_bar_rect_delta',
    (s) => s.queryBar,
    ['x', 'y', 'w', 'h'],
    { x: 'x', y: 'y', width: 'width', height: 'height' },
  ],
]

const CENTER_X = (s, sel) => ({
  x: s[sel].x + s[sel].w / 2,
})

// exact (unrounded) max-min; returns null when any value is missing/non-numeric
function exactDelta(states, getter) {
  const vals = states.map(getter)
  if (vals.some((v) => typeof v !== 'number' || !Number.isFinite(v))) return null
  return Math.max(...vals) - Math.min(...vals)
}

function distinctExact(values) {
  return [...new Set(values)].sort((a, b) => a - b)
}

export function evaluateStrictResult(result) {
  const failures = []
  const checked = []

  const fail = (field, viewport, actual, expected) =>
    failures.push({ field, viewport, actual, expected })
  const ok = (field, viewport, actual) => checked.push({ field, viewport, actual })

  // ---- exact zero-delta assertion; both raw (recomputed) and recorded values must be exactly 0
  const assertExactZero = (field, viewport, raw, recorded) => {
    if (raw === null) {
      fail(field, viewport, raw, '0')
      return
    }
    if (raw !== 0) {
      fail(field, viewport, raw, '0')
      return
    }
    if (recorded !== undefined && recorded !== 0) {
      fail(`${field} (recorded)`, viewport, recorded, '0')
      return
    }
    ok(field, viewport, raw)
  }

  const matrix = result && result.matrix ? result.matrix : {}
  const presentViewports = Object.keys(matrix)

  // the official matrix must contain exactly the four required viewports
  const missing = REQUIRED_VIEWPORTS.filter((v) => !presentViewports.includes(v))
  const extra = presentViewports.filter((v) => !REQUIRED_VIEWPORTS.includes(v))
  if (missing.length) fail('viewports.missing', 'global', missing.join(','), REQUIRED_VIEWPORTS.join(','))
  if (extra.length) fail('viewports.unexpected', 'global', extra.join(','), 'none')

  for (const vp of REQUIRED_VIEWPORTS) {
    const m = matrix[vp]
    if (!m) continue
    const states = Array.isArray(m.states) ? m.states : []
    const deltas = m.deltas || {}
    const invariants = m.invariants || {}

    // ---- §4.1 state_count == 20
    if (states.length !== REQUIRED_STATE_COUNT) {
      fail('state_count', vp, states.length, REQUIRED_STATE_COUNT)
    } else {
      ok('state_count', vp, states.length)
    }

    // the 20 states must be exactly the intended ones (incl. the post-success time-update state)
    const names = states.map((s) => s.name)
    if (JSON.stringify(names) !== JSON.stringify(REQUIRED_STATE_NAMES)) {
      fail('state_names', vp, names.join(','), REQUIRED_STATE_NAMES.join(','))
    }

    // ---- §4.1 whole-rect / slot / button / label-center / query-bar deltas == 0
    for (const [field, getter, rawKeys, keyMap] of RECT_DELTA_SPECS) {
      for (const k of rawKeys) {
        const raw = exactDelta(states, (s) => getter(s)[k])
        assertExactZero(`${field}.${keyMap[k]}`, vp, raw, deltas[field] ? deltas[field][keyMap[k]] : undefined)
      }
    }

    // ---- §4.1 label center x deltas == 0
    for (const [field, sel] of [
      ['refresh_label_center_delta', 'refreshLabel'],
      ['query_label_center_delta', 'queryLabel'],
    ]) {
      const raw = exactDelta(states, (s) => CENTER_X(s, sel).x)
      assertExactZero(`${field}.x`, vp, raw, deltas[field] ? deltas[field].x : undefined)
    }

    // ---- §4.1 query button actual width set strictly equals [62]
    const qw = distinctExact(states.map((s) => s.queryBtn.w))
    if (qw.length !== 1 || qw[0] !== REQUIRED_QUERY_BUTTON_WIDTH) {
      fail('query_button_actual_width_set', vp, qw.join(','), String(REQUIRED_QUERY_BUTTON_WIDTH))
    } else {
      ok('query_button_actual_width_set', vp, qw[0])
    }
    // ---- §4.1 refresh button actual width set strictly equals [110]
    const rw = distinctExact(states.map((s) => s.refreshBtn.w))
    if (rw.length !== 1 || rw[0] !== REQUIRED_REFRESH_BUTTON_WIDTH) {
      fail('refresh_button_actual_width_set', vp, rw.join(','), String(REQUIRED_REFRESH_BUTTON_WIDTH))
    } else {
      ok('refresh_button_actual_width_set', vp, rw[0])
    }

    // ---- §4.1 time reserve: constant text 88:88:88, aria-hidden=true, stable node count
    if (!states.every((s) => s.texts && s.texts.timeReserve === '88:88:88')) {
      fail('reserve_text_always_888888', vp, states.map((s) => s.texts && s.texts.timeReserve).join('|'), '88:88:88')
    } else ok('reserve_text_always_888888', vp, '88:88:88')
    if (!states.every((s) => s.aria && s.aria.reserveHidden === 'true')) {
      fail('reserve_aria_hidden_always', vp, states.map((s) => s.aria && s.aria.reserveHidden).join('|'), 'true')
    } else ok('reserve_aria_hidden_always', vp, 'true')
    const nodeCountKeys = ['reserve', 'actual', 'refreshSpinner', 'querySpinner']
    const nodeCountSets = new Set(states.map((s) => JSON.stringify(s.nodeCounts)))
    if (nodeCountSets.size !== 1 || !states.every((s) => s.nodeCounts.reserve === 1 && s.nodeCounts.actual === 1)) {
      fail('reserve_actual_node_count_stable', vp, [...nodeCountSets].join('|'), 'stable with reserve=1,actual=1')
    } else ok('reserve_actual_node_count_stable', vp, 1)
    for (const k of nodeCountKeys) {
      const raw = exactDelta(states, (s) => s.nodeCounts[k])
      assertExactZero(`node_count.${k}.delta`, vp, raw, undefined)
    }

    // ---- §4.1 label texts always 查询 / 立即刷新
    if (!states.every((s) => s.texts && s.texts.refreshLabel === '立即刷新')) {
      fail('refresh_label_text_always', vp, states.map((s) => s.texts && s.texts.refreshLabel).join('|'), '立即刷新')
    } else ok('refresh_label_text_always', vp, '立即刷新')
    if (!states.every((s) => s.texts && s.texts.queryLabel === '查询')) {
      fail('query_label_text_always', vp, states.map((s) => s.texts && s.texts.queryLabel).join('|'), '查询')
    } else ok('query_label_text_always', vp, '查询')

    // ---- §4.1 spinner visible state only corresponds to its own Loading state
    const badRefresh = states.filter((s) =>
      s.name === 'MANUAL_LOADING' ? s.spinnerVisible.refresh !== true : s.spinnerVisible.refresh !== false,
    )
    if (badRefresh.length) {
      fail(
        'refresh_spinner_visible_only_in_own_loading',
        vp,
        badRefresh.map((s) => `${s.name}:${s.spinnerVisible.refresh}`).join(','),
        'true only in MANUAL_LOADING',
      )
    } else ok('refresh_spinner_visible_only_in_own_loading', vp, 'true only in MANUAL_LOADING')
    const badQuery = states.filter((s) =>
      s.name === 'QUERY_LOADING' ? s.spinnerVisible.query !== true : s.spinnerVisible.query !== false,
    )
    if (badQuery.length) {
      fail(
        'query_spinner_visible_only_in_own_loading',
        vp,
        badQuery.map((s) => `${s.name}:${s.spinnerVisible.query}`).join(','),
        'true only in QUERY_LOADING',
      )
    } else ok('query_spinner_visible_only_in_own_loading', vp, 'true only in QUERY_LOADING')

    // ---- §4.1 buttons never use native disabled
    if (!states.every((s) => s.nativeDisabled.refresh === false && s.nativeDisabled.query === false)) {
      fail(
        'buttons_never_natively_disabled',
        vp,
        states.map((s) => `${s.name}:${s.nativeDisabled.refresh}/${s.nativeDisabled.query}`).join(','),
        'false/false',
      )
    } else ok('buttons_never_natively_disabled', vp, 'false/false')

    // ---- §4.1 existing aria / busy semantics kept
    if (!states.every((s) => s.aria.refreshSpinnerHidden === 'true' && s.aria.querySpinnerHidden === 'true')) {
      fail('spinners_aria_hidden_always', vp, states.map((s) => `${s.aria.refreshSpinnerHidden}/${s.aria.querySpinnerHidden}`).join(','), 'true/true')
    } else ok('spinners_aria_hidden_always', vp, 'true/true')
    const busyBad = states.filter((s) =>
      s.name === 'MANUAL_LOADING' ? s.aria.refreshBusy !== 'true' : s.aria.refreshBusy !== null,
    )
    if (busyBad.length) {
      fail('refresh_aria_busy_only_in_own_loading', vp, busyBad.map((s) => `${s.name}:${s.aria.refreshBusy}`).join(','), 'true only in MANUAL_LOADING')
    } else ok('refresh_aria_busy_only_in_own_loading', vp, 'true only in MANUAL_LOADING')
    const loadingStates = new Set(['MANUAL_LOADING', 'QUERY_LOADING'])
    const ariaDisabledBad = states.filter((s) =>
      loadingStates.has(s.name)
        ? !(s.aria.refreshDisabled === 'true' && s.aria.queryDisabled === 'true')
        : !(s.aria.refreshDisabled === null && s.aria.queryDisabled === null),
    )
    if (ariaDisabledBad.length) {
      fail(
        'aria_disabled_present_only_while_locked',
        vp,
        ariaDisabledBad.map((s) => `${s.name}:${s.aria.refreshDisabled}/${s.aria.queryDisabled}`).join(','),
        'true/true in loading states, null elsewhere',
      )
    } else ok('aria_disabled_present_only_while_locked', vp, 'true/true in loading states, null elsewhere')

    // ---- §4.1 all recorded invariants are true (and there must be some)
    const invKeys = Object.keys(invariants)
    if (invKeys.length === 0) {
      fail('invariants_present', vp, 0, '>0')
    }
    for (const k of invKeys) {
      if (invariants[k] !== true) fail(`invariant.${k}`, vp, invariants[k], true)
      else ok(`invariant.${k}`, vp, true)
    }
  }

  // ---- §4.2 global hard assertions
  const req = result && result.requests ? result.requests : {}
  const nz = (field, viewport, actual) => fail(field, viewport, actual, 0)
  if (req.nonGet !== 0) nz('requests.nonGet', 'global', req.nonGet)
  else ok('requests.nonGet', 'global', 0)
  if (req.apiNonGet !== 0) nz('requests.apiNonGet', 'global', req.apiNonGet)
  else ok('requests.apiNonGet', 'global', 0)

  const consoleErrors = result && Array.isArray(result.consoleErrors) ? result.consoleErrors : null
  if (consoleErrors === null) fail('consoleErrors', 'global', 'missing', '[]')
  else if (consoleErrors.length !== 0) fail('consoleErrors', 'global', consoleErrors.join(' | '), 0)
  else ok('consoleErrors', 'global', 0)

  const leak = (result && result.otherRouteLeak) || null
  if (!leak) fail('otherRouteLeak', 'global', 'missing', 'all zero')
  else
    for (const k of ['dssNodes', 'refreshGroup', 'spinner', 'actionLabel']) {
      if (leak[k] !== 0) fail(`otherRouteLeak.${k}`, 'global', leak[k], 0)
      else ok(`otherRouteLeak.${k}`, 'global', 0)
    }

  // ---- §4.2 reduced motion: animation none, indicator still statically visible, idle/loading rects identical
  const rm = (result && result.reducedMotion) || null
  if (!rm) {
    fail('reducedMotion', 'global', 'missing', 'object')
  } else {
    for (const k of ['refreshSpinner', 'querySpinner']) {
      if (rm.reducedMediaAnimation?.[k] !== 'none') fail(`reducedMotion.reducedMediaAnimation.${k}`, 'global', rm.reducedMediaAnimation?.[k], 'none')
      else ok(`reducedMotion.reducedMediaAnimation.${k}`, 'global', 'none')
      if (rm.reducedLoadingAnimation?.[k] !== 'none') fail(`reducedMotion.reducedLoadingAnimation.${k}`, 'global', rm.reducedLoadingAnimation?.[k], 'none')
      else ok(`reducedMotion.reducedLoadingAnimation.${k}`, 'global', 'none')
    }
    if (rm.reducedLoadingSpinnerVisible?.refresh !== true) {
      fail('reducedMotion.loadingIndicatorStaticallyVisible', 'global', rm.reducedLoadingSpinnerVisible?.refresh, true)
    } else ok('reducedMotion.loadingIndicatorStaticallyVisible', 'global', true)
    if (rm.idleVsReducedIdleSameRect !== true) {
      fail('reducedMotion.idleVsReducedIdleSameRect', 'global', rm.idleVsReducedIdleSameRect, true)
    } else ok('reducedMotion.idleVsReducedIdleSameRect', 'global', true)
    if (rm.reducedIdleVsReducedLoadingSameRect !== true) {
      fail('reducedMotion.idleVsReducedLoadingSameRect', 'global', rm.reducedIdleVsReducedLoadingSameRect, true)
    } else ok('reducedMotion.idleVsReducedLoadingSameRect', 'global', true)
  }

  return {
    passed: failures.length === 0,
    failure_count: failures.length,
    check_count: checked.length,
    failures,
    checked,
  }
}
