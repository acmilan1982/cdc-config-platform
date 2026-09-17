import { describe, it, expect } from 'vitest'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

/**
 * 公共层结构契约（SHARED_COMPONENT_DESIGN §7.5.3、§7.11.1、§7.3.2、§7.3.3、§8）：
 * 1) 常驻 Spinner 满足「一个类名、一份 CSS、一个令牌」：
 *    仓库中只有 `query-list-spinner.css` 一份规则源码，两个消费者
 *    （QueryListActions / QueryListRefreshToolbar）以 `<style scoped src>` 引用同一文件；
 *    任何组件内联样式都不得再声明 Spinner 选择器、动画或 reduced-motion 规则。
 *    颜色一律 currentColor，不写死颜色。断言对象是「一份来源被两个消费者引用」，
 *    而不是「两份副本内容一致」。
 * 2) 第一轮明确「推迟到第二个消费者出现再做」的 3 个 composable 与「合并进结果面板」的薄包装组件
 *    在本轮**不得存在**（连空文件/别名/占位都不允许）。
 */

const QUERY_LIST_DIR = resolve(process.cwd(), 'src/components/query-list')
const SRC_DIR = resolve(process.cwd(), 'src')

const SPINNER_CSS = 'query-list-spinner.css'
const SPINNER_CSS_PATH = join(QUERY_LIST_DIR, SPINNER_CSS)
const SPINNER_CONSUMERS = ['QueryListActions.vue', 'QueryListRefreshToolbar.vue']

/**
 * 选择器与动画名一律以拼接方式构造：避免本测试文件自身的源码被下述
 * 「全部 frontend/src 只有一份来源」扫描误计入。
 */
const SPINNER_CLASS = ['.', 'ql-btn-spinner'].join('')
const SPINNER_VISIBLE_CLASS = [SPINNER_CLASS, '.is-visible'].join('')
const SPIN_ROTATE_KEYFRAMES = ['@keyframes ', 'ql-action-spin'].join('')
const SPINNER_TOKEN = ['--ql-btn-spinner', '-inset'].join('')

function source(file: string): string {
  return readFileSync(join(QUERY_LIST_DIR, file), 'utf8')
}

function stripComments(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, '')
}

/** 组件内联样式块（排除 `<style ... src="...">` 外链块），已剥离注释。 */
function inlineStyle(file: string): string {
  const blocks = [...source(file).matchAll(/<style(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/style>/g)].map(
    (m) => m[1] ?? '',
  )
  return stripComments(blocks.join('\n'))
}

/** 组件通过 `<style ... src="...">` 引用的外部样式表相对路径。 */
function externalStyleRefs(file: string): string[] {
  return [...source(file).matchAll(/<style[^>]*\bsrc="([^"]+)"[^>]*>/g)].map((m) => m[1] ?? '')
}

function spinnerCss(): string {
  return stripComments(readFileSync(SPINNER_CSS_PATH, 'utf8'))
}

/** 剥离 `@media` 块（单层嵌套），只保留基础层规则。 */
function withoutMedia(css: string): string {
  return css.replace(/@media[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '')
}

function ruleBody(css: string, selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`))?.[1] ?? ''
}

/** 统计给定文本中某选择器的规则开括号次数（即「核心定义」条数）。 */
function ruleOpenings(text: string, selector: string): number {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return (text.match(new RegExp(`${escaped}\\s*\\{`, 'g')) ?? []).length
}

function reducedMotionBody(css: string): string | null {
  return css.match(/@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*)\}\s*$/)?.[1] ?? null
}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, out)
    else out.push(full)
  }
  return out
}

describe('常驻 Spinner「一个类名 / 一份 CSS / 一个令牌」（§7.5.3、§7.11.1）', () => {
  it('公共层内部样式源 query-list-spinner.css 存在且非空', () => {
    expect(existsSync(SPINNER_CSS_PATH)).toBe(true)
    expect(spinnerCss()).not.toBe('')
  })

  it('两个消费者以外部 scoped stylesheet 引用同一份来源，且各自只引用一次', () => {
    for (const file of SPINNER_CONSUMERS) {
      expect(externalStyleRefs(file), file).toEqual([`./${SPINNER_CSS}`])
    }
    // 两个消费者解析到同一个文件
    const resolved = SPINNER_CONSUMERS.map((file) =>
      resolve(QUERY_LIST_DIR, externalStyleRefs(file)[0]!),
    )
    expect(new Set(resolved).size).toBe(1)
    expect(resolved[0]).toBe(SPINNER_CSS_PATH)
  })

  it('两个组件的内联样式中不再定义 Spinner 选择器、Spinner 动画或 Spinner reduced-motion', () => {
    for (const file of SPINNER_CONSUMERS) {
      const inline = inlineStyle(file)
      expect(ruleOpenings(inline, SPINNER_CLASS), file).toBe(0)
      expect(ruleOpenings(inline, SPINNER_VISIBLE_CLASS), file).toBe(0)
      expect(inline, file).not.toContain(SPIN_ROTATE_KEYFRAMES)
      const media = reducedMotionBody(inline)
      if (media !== null) expect(media, file).not.toContain('spinner')
    }
  })

  it('全部 frontend/src 中 Spinner 核心选择器与动画的 CSS 定义源码只有该文件一处', () => {
    const hits: Array<{ file: string; base: number; visible: number; keyframes: boolean }> = []
    for (const file of walk(SRC_DIR)) {
      const text = stripComments(readFileSync(file, 'utf8'))
      const base = ruleOpenings(text, SPINNER_CLASS)
      const visible = ruleOpenings(text, SPINNER_VISIBLE_CLASS)
      const keyframes = text.includes(SPIN_ROTATE_KEYFRAMES)
      if (base > 0 || visible > 0 || keyframes) {
        hits.push({ file: file.slice(SRC_DIR.length + 1), base, visible, keyframes })
      }
    }
    // 该文件内 `.ql-btn-spinner` 出现 2 次：1 条基础几何规则 + 1 条 reduced-motion 动画覆盖；
    // `.ql-btn-spinner.is-visible` 与 `@keyframes` 各 1 次。除此之外全仓库无第二处来源。
    expect(hits).toEqual([
      { file: `components/query-list/${SPINNER_CSS}`, base: 2, visible: 1, keyframes: true },
    ])
  })

  it('基础层各只有一条核心定义，逐声明保持冻结事实值', () => {
    const css = withoutMedia(spinnerCss())
    expect(ruleOpenings(css, SPINNER_CLASS)).toBe(1)
    expect(ruleOpenings(css, SPINNER_VISIBLE_CLASS)).toBe(1)

    const base = ruleBody(css, SPINNER_CLASS)
    expect(base).not.toBe('')
    expect(base).toMatch(/(^|;)\s*position:\s*absolute\s*(;|$)/)
    expect(base).toMatch(/left:\s*var\(--ql-btn-spinner-inset,\s*2px\)/)
    expect(base).toMatch(/(^|;)\s*top:\s*50%\s*(;|$)/)
    expect(base).toMatch(/(^|;)\s*width:\s*12px\s*(;|$)/)
    expect(base).toMatch(/(^|;)\s*height:\s*12px\s*(;|$)/)
    expect(base).toMatch(/(^|;)\s*margin-top:\s*-6px\s*(;|$)/)
    expect(base).toMatch(/(^|;)\s*box-sizing:\s*border-box\s*(;|$)/)
    expect(base).toMatch(/(^|;)\s*border-radius:\s*50%\s*(;|$)/)
    expect(base).toMatch(/border:\s*2px solid currentColor/)
    expect(base).toMatch(/border-top-color:\s*transparent/)
    expect(base).toMatch(/(^|;)\s*opacity:\s*0\s*(;|$)/)
    expect(base).toMatch(/(^|;)\s*visibility:\s*hidden\s*(;|$)/)
    expect(base).toMatch(/animation:\s*ql-action-spin 0\.6s linear infinite/)

    const visible = ruleBody(css, SPINNER_VISIBLE_CLASS)
    expect(visible).toMatch(/(^|;)\s*opacity:\s*1\s*(;|$)/)
    expect(visible).toMatch(/(^|;)\s*visibility:\s*visible\s*(;|$)/)
    // 显示态不再声明几何：几何只在基础规则里定义一次
    expect(visible).not.toMatch(/width|height|margin|padding|position/)
  })

  it('只切换 opacity/visibility 显示，不用 display:none；只用一个类名与一个令牌', () => {
    const css = spinnerCss()
    const classes = [...new Set(css.match(/\.ql-[a-z-]+/g) ?? [])]
    expect(classes).toEqual([SPINNER_CLASS])
    const tokens = [...new Set(css.match(/--ql-[a-z-]+/g) ?? [])]
    expect(tokens).toEqual([SPINNER_TOKEN])
    expect(css).not.toMatch(/display\s*:\s*none/)
  })

  it('颜色只取 currentColor，不写死颜色；不含 Feature 私有或全局基础选择器', () => {
    const css = spinnerCss()
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    expect(css).not.toMatch(/\brgba?\(/)
    expect(css).not.toMatch(/hsl/)
    expect(css).not.toMatch(/\.dss-/)
    expect(css).not.toMatch(/:root/)
    expect(css).not.toMatch(/(^|\})\s*(html|body|\*)\s*\{/m)
    expect(css).not.toMatch(/!important|:deep\(|::v-deep/)
  })

  it('reduced-motion 只关闭 Spinner 动画，不复制或改变几何与可见性（指示器仍静态可见）', () => {
    const media = reducedMotionBody(spinnerCss())
    expect(media).not.toBeNull()
    const blocks = [...media!.matchAll(/([.#][\w-]*(?:\.[\w-]+)*)[^{]*\{([^}]*)\}/g)]
    expect(blocks.length).toBeGreaterThan(0)
    const spinnerBlocks = blocks.filter(([, selector]) => selector === SPINNER_CLASS)
    expect(spinnerBlocks).toHaveLength(1)
    const body = spinnerBlocks[0]![2]!
    expect(body).toMatch(/animation:\s*none/)
    // 媒体查询里不得再声明尺寸、定位、透明度或可见性
    expect(body).not.toMatch(/width|height|opacity|visibility|position|margin|display/)
    // 也不得把整个 Spinner 规则复制进媒体查询
    expect(media!).not.toContain(SPINNER_VISIBLE_CLASS)
  })

  it('QueryListRefreshToolbar 的环进度 reduced-motion 规则仍留在组件内，未并入 Spinner 公共来源', () => {
    const media = reducedMotionBody(inlineStyle('QueryListRefreshToolbar.vue'))
    expect(media).not.toBeNull()
    expect(ruleBody(media!, '.ql-ring-progress')).toMatch(/transition:\s*none/)
    expect(spinnerCss()).not.toContain('ql-ring-progress')
  })

  it('公共默认偏移 2px 由唯一令牌承担；参考页仍以页面局部令牌把刷新指示器覆写为 3px', () => {
    expect(spinnerCss()).toMatch(/var\(--ql-btn-spinner-inset,\s*2px\)/)
    // 公共来源自身不得内含页面局部偏移值
    expect(spinnerCss()).not.toMatch(/\b3px\b/)
    const page = readFileSync(
      resolve(SRC_DIR, 'views/data-source-run-state/DataSourceRunStatePage.vue'),
      'utf8',
    )
    expect(page).toMatch(/'--ql-btn-spinner-inset':\s*'3px'/)
  })
})

describe('第一轮冻结决策的可执行校验（§7.3.2 / §7.3.3 / §8）', () => {
  const DEFERRED = [
    'useQueryListAppliedQuery.ts',
    'useQueryListSingleFlightRequest.ts',
    'useQueryListVisibleAutoRefresh.ts',
  ]

  it('推迟到第二轮消费者的 3 个 composable 在 src 下不存在任何文件（含占位）', () => {
    const files = walk(SRC_DIR)
    for (const name of DEFERRED) {
      const hits = files.filter((f) => f.endsWith(name))
      expect(hits, `${name} 不应存在`).toEqual([])
    }
  })

  it('源码中不出现这 3 个被推迟 composable 的导入或引用', () => {
    const bare = /useQueryListAppliedQuery|useQueryListSingleFlightRequest|useQueryListVisibleAutoRefresh/
    const files = walk(SRC_DIR).filter((f) => !f.endsWith('shared-layer.spec.ts'))
    for (const file of files) {
      expect(readFileSync(file, 'utf8'), file).not.toMatch(bare)
    }
  })

  it('合并进结果面板正文区的薄包装组件不得存在（StableTableContainer 不单独成组件）', () => {
    expect(existsSync(join(QUERY_LIST_DIR, 'StableTableContainer.vue'))).toBe(false)
    const files = walk(SRC_DIR).filter((f) => !f.endsWith('shared-layer.spec.ts'))
    for (const file of files) {
      expect(readFileSync(file, 'utf8'), file).not.toMatch(/StableTableContainer/)
    }
  })

  it('公共层只暴露批准的 6 个组件与 1 个 composable 入口；Spinner 样式源不成为公共导出', () => {
    const index = source('index.ts')
    const components = [...index.matchAll(/from '\.\/(QueryList\w+)\.vue'/g)].map((m) => m[1])
    expect(components.sort()).toEqual([
      'QueryListActions',
      'QueryListPageShell',
      'QueryListQueryPanel',
      'QueryListRefreshToolbar',
      'QueryListResultPanel',
      'QueryListTooltipHost',
    ])
    expect(index).toMatch(/export \{ useQueryListTooltip, QUERY_LIST_TOOLTIP_DELAY_MS \}/)
    // 内部样式源不对外导出
    expect(index).not.toMatch(/query-list-spinner/)
    const vueFiles = readdirSync(QUERY_LIST_DIR).filter((f) => f.endsWith('.vue'))
    expect(vueFiles.sort()).toEqual(components.map((c) => `${c}.vue`).sort())
  })

  it('组件目录仅含获批组件、声明文件与公共层内部唯一 Spinner 样式源（无散件）', () => {
    const entries = readdirSync(QUERY_LIST_DIR).filter((f) => !f.endsWith('.spec.ts'))
    expect(entries.sort()).toEqual(
      [
        'QueryListActions.vue',
        'QueryListPageShell.vue',
        'QueryListQueryPanel.vue',
        'QueryListRefreshToolbar.vue',
        'QueryListResultPanel.vue',
        'QueryListTooltipHost.vue',
        'index.ts',
        'types.ts',
        SPINNER_CSS,
      ].sort(),
    )
  })

  it('composable 目录仅含 Tooltip 控制器', () => {
    const entries = readdirSync(resolve(SRC_DIR, 'composables/query-list'))
    expect(entries.sort()).toEqual(['useQueryListTooltip.spec.ts', 'useQueryListTooltip.ts'].sort())
  })
})
