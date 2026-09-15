/**
 * 纯判定函数（无 I/O、无页面依赖）：从原始未舍入几何值重算 §9.4 硬断言。
 * 严格使用 === 0，不设任何容差；任一项不满足即返回失败项。
 * 真实运行与负向自证共用本模块，保证负向自证真的走同一条判定路径。
 */

export const EXPECTED = {
  queryButtonWidthPx: 62,
  resetButtonWidthPx: 62,
  refreshButtonWidthPx: 110,
  longRows: 30,
  shortRows: 1,
}

/** 未舍入差值：直接相减，不做任何 toFixed / Math.round。 */
export function delta(a, b) {
  return a - b
}

function rectDelta(a, b) {
  if (!a || !b) return null
  return {
    x: delta(b.x, a.x),
    y: delta(b.y, a.y),
    width: delta(b.width, a.width),
    height: delta(b.height, a.height),
  }
}

function allZero(obj) {
  return obj && Object.values(obj).every((v) => v === 0)
}

function widthSet(samples, pick) {
  const out = []
  for (const s of samples) {
    const v = pick(s)
    if (v === null || v === undefined) continue
    if (!out.includes(v)) out.push(v)
  }
  return out
}

export function judge(raw) {
  const checks = []
  const add = (name, ok, detail) => checks.push({ name, ok: !!ok, detail })

  const errors = raw.consoleErrors ?? []
  add('browser_console_errors_zero', errors.length === 0, `${errors.length}`)
  const nonGet = raw.networkSummary?.nonGet ?? []
  add('browser_non_get_requests_zero', nonGet.length === 0, JSON.stringify(nonGet))

  // 采样覆盖度：4 视口 × 2 状态
  add('long_samples_count_4', raw.longSamples.length === 4, `${raw.longSamples.length}`)
  add('short_samples_count_4', raw.shortSamples.length === 4, `${raw.shortSamples.length}`)

  // 全局按钮宽度集合
  const qSet = widthSet([...raw.longSamples, ...raw.shortSamples], (s) => s.buttons.query?.width)
  const rSet = widthSet([...raw.longSamples, ...raw.shortSamples], (s) => s.buttons.reset?.width)
  const fSet = widthSet([...raw.longSamples, ...raw.shortSamples], (s) => s.buttons.refresh?.width)
  add('query_button_width_set', qSet.length === 1 && qSet[0] === EXPECTED.queryButtonWidthPx, JSON.stringify(qSet))
  add('reset_button_width_set', rSet.length === 1 && rSet[0] === EXPECTED.resetButtonWidthPx, JSON.stringify(rSet))
  add('refresh_button_width_set', fSet.length === 1 && fSet[0] === EXPECTED.refreshButtonWidthPx, JSON.stringify(fSet))

  // 重置按钮四属性锁（计算值必须同锁 62px）
  for (const [i, s] of [...raw.longSamples, ...raw.shortSamples].entries()) {
    const b = s.buttons.reset
    add(
      `reset_four_property_lock[${i}]`,
      b &&
        b.widthCss === '62px' &&
        b.minWidthCss === '62px' &&
        b.maxWidthCss === '62px' &&
        b.flexBasisCss === '62px',
      JSON.stringify({ w: b?.widthCss, min: b?.minWidthCss, max: b?.maxWidthCss, basis: b?.flexBasisCss }),
    )
  }

  // 路由私有类：长/短两态都必须存在
  for (const [i, s] of raw.longSamples.entries()) {
    add(`long_private_gutter_class[${i}]`, s.contentArea.hasPrivateGutterClass === true, `viewport=${s.viewport.innerWidth}`)
    add(`long_scrollbar_gutter_computed_stable[${i}]`, s.contentArea.scrollbarGutterComputed === 'stable', s.contentArea.scrollbarGutterComputed)
    add(`long_has_real_vertical_scroll_need[${i}]`, s.contentArea.hasVerticalScrollNeed === true, `scrollHeight=${s.contentArea.scrollHeight} clientHeight=${s.contentArea.clientHeight}`)
    add(`long_row_count[${i}]`, s.rowCount === EXPECTED.longRows, `${s.rowCount}`)
    add(`long_overflow_y_auto[${i}]`, s.contentArea.overflowYComputed === 'auto', s.contentArea.overflowYComputed)
  }
  for (const [i, s] of raw.shortSamples.entries()) {
    add(`short_private_gutter_class[${i}]`, s.contentArea.hasPrivateGutterClass === true, `viewport=${s.viewport.innerWidth}`)
    add(`short_scrollbar_gutter_computed_stable[${i}]`, s.contentArea.scrollbarGutterComputed === 'stable', s.contentArea.scrollbarGutterComputed)
    add(`short_row_count[${i}]`, s.rowCount === EXPECTED.shortRows, `${s.rowCount}`)
  }

  // 逐视口 长/短 对比
  const perViewport = []
  const n = Math.min(raw.longSamples.length, raw.shortSamples.length)
  for (let i = 0; i < n; i++) {
    const L = raw.longSamples[i]
    const S = raw.shortSamples[i]
    const vp = `${L.viewport.innerWidth}x${L.viewport.innerHeight}`
    const rec = { viewport: vp }

    const caRect = rectDelta(L.contentArea.rect, S.contentArea.rect)
    rec.content_area_rect_delta = caRect
    add(`[${vp}] content_area_rect_delta_zero`, allZero(caRect), JSON.stringify(caRect))

    const cwDelta = delta(S.contentArea.clientWidth, L.contentArea.clientWidth)
    rec.content_area_client_width_delta = cwDelta
    add(`[${vp}] content_area_client_width_delta_zero`, cwDelta === 0, `${cwDelta}`)

    for (const key of ['query', 'reset', 'refresh']) {
      const d = rectDelta(L.buttons[key], S.buttons[key])
      rec[`${key}_button_self_rect_delta`] = d
      add(`[${vp}] ${key}_button_self_rect_delta_zero`, allZero(d), JSON.stringify(d))
    }

    const qaDelta = rectDelta(L.queryActions, S.queryActions)
    rec.query_actions_rect_delta = qaDelta
    add(`[${vp}] query_actions_rect_delta_zero`, allZero(qaDelta), JSON.stringify(qaDelta))

    // 表头单元：按 index + label 稳定识别
    const Lh = L.headers ?? []
    const Sh = S.headers ?? []
    rec.header_cell_count_long = Lh.length
    rec.header_cell_count_short = Sh.length
    add(`[${vp}] header_cell_count_7`, Lh.length === 7 && Sh.length === 7, `${Lh.length}/${Sh.length}`)
    add(
      `[${vp}] header_labels_identical`,
      Lh.length === Sh.length && Lh.every((h, k) => h.label === Sh[k].label),
      JSON.stringify(Lh.map((h) => h.label)),
    )
    const xDeltas = Lh.map((h, k) => h.x - Sh[k].x)
    const wDeltas = Lh.map((h, k) => h.width - Sh[k].width)
    rec.all_table_header_cell_x_delta = xDeltas
    rec.all_table_header_cell_width_delta = wDeltas
    add(`[${vp}] all_table_header_cell_x_delta_zero`, xDeltas.every((v) => v === 0), JSON.stringify(xDeltas))
    add(`[${vp}] all_table_header_cell_width_delta_zero`, wDeltas.every((v) => v === 0), JSON.stringify(wDeltas))
    add(`[${vp}] header_cells_7_nonzero_width`, Lh.every((h) => h.width > 0), JSON.stringify(Lh.map((h) => h.width)))

    perViewport.push(rec)
  }

  // §9.5 路由隔离
  const ri = raw.routeIsolation ?? []
  for (const r of ri) {
    add(`route_isolation[${r.path}]_private_class`, r.hasPrivateClass === r.expectedPrivateClass, `${r.hasPrivateClass}`)
    if (r.expectedPrivateClass) {
      add(`route_isolation[${r.path}]_gutter_stable`, r.scrollbarGutterComputed === 'stable', r.scrollbarGutterComputed)
    } else {
      add(`route_isolation[${r.path}]_gutter_not_stable`, r.scrollbarGutterComputed !== 'stable', r.scrollbarGutterComputed)
      add(`route_isolation[${r.path}]_gutter_auto`, r.scrollbarGutterComputed === 'auto', r.scrollbarGutterComputed)
    }
  }
  add('route_isolation_probe_count', ri.length === 4, `${ri.length}`)

  // §9.5 重置语义
  const rs = raw.resetSemantics ?? {}
  add('reset_does_not_query_immediately', rs.listRequestsImmediatelyAfterReset === 0, `${rs.listRequestsImmediatelyAfterReset}`)
  add('reset_keeps_short_rows', rs.rowsImmediatelyAfterReset === EXPECTED.shortRows, `${rs.rowsImmediatelyAfterReset}`)
  add(
    'post_reset_query_restores_long_rows',
    rs.rowsAfterPostResetQuery === EXPECTED.longRows && rs.listRequestsDeltaOnPostResetQuery >= 1,
    `rows=${rs.rowsAfterPostResetQuery} delta=${rs.listRequestsDeltaOnPostResetQuery}`,
  )

  // §9.5 在途帧稳定性：所有采样帧中三按钮自矩形必须逐字段完全一致，文字恒定
  const ls = raw.loadingStability
  if (ls) {
    const keys = ['query', 'reset', 'refresh']
    for (const k of keys) {
      const rects = ls.frames.map((f) => f[k]).filter(Boolean)
      const base = rects[0]
      const stable = rects.every((r) => r.x === base.x && r.y === base.y && r.width === base.width && r.height === base.height)
      add(`loading_frames_${k}_rect_stable`, stable, stable ? `over ${rects.length} frames` : JSON.stringify(rects.map((r) => [r.x, r.y, r.width, r.height])))
    }
    add('loading_frames_query_spinner_observed', ls.framesWithQuerySpinner >= 1, `${ls.framesWithQuerySpinner}`)
    add('loading_frames_query_text_constant', ls.frames.every((f) => f.queryText === '查询'), JSON.stringify([...new Set(ls.frames.map((f) => f.queryText))]))
    add('loading_frames_reset_text_constant', ls.frames.every((f) => f.resetText === '重置'), JSON.stringify([...new Set(ls.frames.map((f) => f.resetText))]))
    add('loading_frames_refresh_text_constant', ls.frames.every((f) => f.refreshText === '立即刷新'), JSON.stringify([...new Set(ls.frames.map((f) => f.refreshText))]))
    add('loading_frames_refresh_spinner_never_shown_for_query', ls.frames.every((f) => f.refreshSpinnerVisible === false), `${ls.frames.filter((f) => f.refreshSpinnerVisible).length}`)
  }

  const failures = checks.filter((c) => !c.ok)
  return { pass: failures.length === 0, checks, failures, perViewport }
}

export default judge
