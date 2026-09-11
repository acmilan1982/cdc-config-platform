/**
 * 归约 popper-harness narrow 模式（narrow.json）为可复核的窄表：
 *   - 每个窄视口（480/400/240）× 每个维度（client/source/status）：
 *     外层实际宽度 outerW、左右边界 outerL/outerR、是否越出视口 outOfViewport
 *     内层 innerW、内层 computed min-width（EP 内联）、内层是否溢出外层
 *     页面是否出现水平溢出 hOverflow、是否出现纵向滚动 vScroll
 *     侧边栏是否遮挡、console 错误、非 GET 请求
 * 用法: node scripts/reduce-narrow.cjs [narrow.json] [out.json]
 */
const fs = require('fs')
const path = require('path')

const inFile = process.argv[2] || path.join(__dirname, '..', 'narrow.json')
const outFile = process.argv[3] || path.join(__dirname, '..', 'narrow-summary.json')
const S = JSON.parse(fs.readFileSync(inFile, 'utf8'))
const DIMS = ['client', 'source', 'status']

const out = {
  source: path.basename(inFile),
  mode: S.mode,
  route: S.route,
  cases: S.cases.map((c) => {
    const dims = {}
    for (const dim of DIMS) {
      const d = c.dims[dim]
      dims[dim] = {
        target: d.formula.target,
        viewportW: d.formula.viewportW,
        expect: d.formula.expect,
        outerW: d.outerW,
        outerL: d.outerL,
        outerR: d.outerR,
        outOfViewport: d.outOfViewport,
        innerW: d.innerW,
        innerMinWidthCss: d.innerMinWidthCss,
        innerInline: d.innerInline,
        innerOverflowsOuter: d.innerOverflowsOuter,
        wrapHOverflow: d.wrapHOverflow,
        hOverflow: d.A_INIT.hOverflow,
        vScroll: d.vScroll
      }
    }
    return {
      label: c.label,
      viewportW: c.viewportW,
      sidebarOverlay: c.sidebarOverlay,
      consoleErrors: c.consoleErrors,
      nonGet: c.nonGet,
      dims
    }
  }),
  global: S.global
}

fs.writeFileSync(outFile, JSON.stringify(out, null, 2))

const lines = []
for (const c of out.cases) {
  lines.push(`## ${c.label} (viewportW=${c.viewportW})  sidebarOverlay=${JSON.stringify(c.sidebarOverlay)}`)
  for (const dim of DIMS) {
    const d = c.dims[dim]
    lines.push(
      `  ${dim.padEnd(7)} target=${String(d.target).padStart(3)} expect=${String(d.expect).padStart(3)} ` +
        `outerW=${String(d.outerW).padStart(3)} [L=${d.outerL} R=${d.outerR}] outOfViewport=${d.outOfViewport}  ` +
        `innerW=${String(d.innerW).padStart(3)} innerMinWidth=${String(d.innerMinWidthCss).padStart(6)} ` +
        `innerOverflowsOuter=${d.innerOverflowsOuter}  hOverflow=${d.hOverflow} vScroll=${d.vScroll}`
    )
  }
  lines.push(`  consoleErrors=${JSON.stringify(c.consoleErrors)} nonGet=${JSON.stringify(c.nonGet)}`)
}
lines.push(`## global consoleErrors=${JSON.stringify(S.global.consoleErrors)} nonGet=${JSON.stringify(S.global.nonGet)}`)
console.log(lines.join('\n'))
