/**
 * 归约 popper-harness matrix 的原始测量（matrix.json）为可复核的窄表：
 *   - 每个视口 × 每个维度（client/source/status）：外层宽度在 5 次重复 × 全部状态下
 *     的取值集合、min/max/spread(mmax-min)
 *   - 同一重复内相邻状态之间的外层宽度 delta 绝对值最大值（状态不变性）
 *   - 内层 .el-select-dropdown 宽度同样统计
 * 用法: node scripts/reduce-matrix.cjs [matrix.json] [out.json]
 */
const fs = require('fs')
const path = require('path')

const inFile = process.argv[2] || path.join(__dirname, '..', 'matrix.json')
const outFile = process.argv[3] || path.join(__dirname, '..', 'matrix-summary.json')
const S = JSON.parse(fs.readFileSync(inFile, 'utf8'))

const DIMS = ['client', 'source', 'status']
const num = (v) => (typeof v === 'number' && isFinite(v) ? v : null)
const round = (v) => (v === null ? null : Math.round(v * 1000) / 1000)

function collectWidths(repObj, layer) {
  const out = []
  for (const [k, v] of Object.entries(repObj)) {
    if (!v || typeof v !== 'object' || !v[layer]) continue
    const w = num(v[layer] && v[layer].rect && v[layer].rect.w)
    out.push({ state: k, w })
  }
  return out
}

function layerStats(repObj, layer) {
  const series = collectWidths(repObj, layer).filter((x) => x.w !== null)
  const ws = series.map((x) => x.w)
  if (!ws.length) return { n: 0, min: null, max: null, spread: null, values: [], maxAdjacentDelta: null, adjacentDeltas: [] }
  const min = Math.min(...ws)
  const max = Math.max(...ws)
  const adjacentDeltas = []
  for (let i = 1; i < series.length; i++) adjacentDeltas.push(Math.abs(series[i].w - series[i - 1].w))
  return {
    n: ws.length,
    min: round(min),
    max: round(max),
    spread: round(max - min),
    values: series.map((x) => ({ state: x.state, w: round(x.w) })),
    adjacentDeltas: adjacentDeltas.map(round),
    maxAdjacentDelta: adjacentDeltas.length ? round(Math.max(...adjacentDeltas)) : null
  }
}

// 跨重复聚合：把 5 次重复里同名状态的宽度放一起，得到跨重复 spread（即“选中项无关”稳定性）
function crossRep(repArr, layer) {
  const byState = new Map()
  for (const rep of repArr) {
    for (const { state, w } of collectWidths(rep, layer)) {
      if (w === null) continue
      if (!byState.has(state)) byState.set(state, [])
      byState.get(state).push(w)
    }
  }
  const rows = []
  for (const [state, ws] of byState) {
    rows.push({ state, n: ws.length, min: round(Math.min(...ws)), max: round(Math.max(...ws)), spread: round(Math.max(...ws) - Math.min(...ws)) })
  }
  const all = rows.flatMap((r) => [r.min, r.max])
  return {
    states: rows,
    globalMin: all.length ? round(Math.min(...all)) : null,
    globalMax: all.length ? round(Math.max(...all)) : null,
    globalSpread: all.length ? round(Math.max(...all) - Math.min(...all)) : null,
    maxStateSpread: rows.length ? round(Math.max(...rows.map((r) => r.spread))) : null
  }
}

const out = {
  source: path.basename(inFile),
  mode: S.mode,
  route: S.route,
  reps: S.reps,
  expectedWidths: { client: 480, source: 400, status: 240 },
  viewports: S.viewports.map((v) => {
    const dims = {}
    for (const dim of DIMS) {
      const reps = v.dims[dim] || []
      const outerPerRep = reps.map((r) => layerStats(r, 'outer'))
      const innerPerRep = reps.map((r) => layerStats(r, 'inner'))
      dims[dim] = {
        outer: {
          crossRep: crossRep(reps, 'outer'),
          maxSpreadAcrossReps: round(Math.max(...outerPerRep.map((x) => (x.spread === null ? 0 : x.spread)))),
          maxAdjacentDeltaAcrossReps: round(Math.max(...outerPerRep.flatMap((x) => x.adjacentDeltas.length ? x.adjacentDeltas : [0]))),
          perRep: outerPerRep.map((x) => ({ min: x.min, max: x.max, spread: x.spread, maxAdjacentDelta: x.maxAdjacentDelta, n: x.n }))
        },
        inner: {
          crossRep: crossRep(reps, 'inner'),
          maxSpreadAcrossReps: round(Math.max(...innerPerRep.map((x) => (x.spread === null ? 0 : x.spread))))
        },
        measuredStates: outerPerRep[0] ? outerPerRep[0].n : 0
      }
    }
    return { viewport: v.viewport, dims }
  }),
  global: S.global
}

fs.writeFileSync(outFile, JSON.stringify(out, null, 2))

// 控制台窄表，便于直接粘进报告
const lines = []
for (const v of out.viewports) {
  lines.push(`## ${v.viewport}`)
  for (const dim of DIMS) {
    const c = v.dims[dim]
    lines.push(
      `  ${dim.padEnd(7)} target=${String(out.expectedWidths[dim]).padStart(3)}  states=${c.measuredStates}  ` +
        `outer[min=${c.outer.crossRep.globalMin} max=${c.outer.crossRep.globalMax} spread=${c.outer.crossRep.globalSpread} ` +
        `maxAdjacentDelta=${c.outer.maxAdjacentDeltaAcrossReps}]  ` +
        `inner[min=${c.inner.crossRep.globalMin} max=${c.inner.crossRep.globalMax} spread=${c.inner.crossRep.globalSpread}]`
    )
  }
}
lines.push(`## global consoleErrors=${JSON.stringify(S.global.consoleErrors)} nonGet=${JSON.stringify(S.global.nonGet)}`)
console.log(lines.join('\n'))
